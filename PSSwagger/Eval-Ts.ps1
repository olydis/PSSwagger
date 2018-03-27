$srcTsInvoke = @"
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Management.Automation;

public static class NodeTs
{

static void StartCollect(Process process, out string stdoutx, out string stderrx)
{
    int timeout = 10000;
    string stdout = "";
    string stderr = "";

    using (AutoResetEvent outputWaitHandle = new AutoResetEvent(false))
    using (AutoResetEvent errorWaitHandle = new AutoResetEvent(false))
    {
        process.OutputDataReceived += (sender, e) => {
            if (e.Data == null) outputWaitHandle.Set();
            else stdout += e.Data;
        };
        process.ErrorDataReceived += (sender, e) =>
        {
            if (e.Data == null) errorWaitHandle.Set();
            else stderr += e.Data;
        };

        process.Start();

        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        if (process.WaitForExit(timeout) &&
            outputWaitHandle.WaitOne(timeout) &&
            errorWaitHandle.WaitOne(timeout))
        {
            stdoutx = stdout;
            stderrx = stderr;
        }
        else
        {
            throw new Exception("timeout");
        }
    }
}
    

public static object Eval(string code, string func, string args)
{
    code = code + ";\n console.log(JSON.stringify(" + func + ".apply(null, require(process.argv.reverse()[0]).args)))";

    string target = Path.GetTempPath() + "ts" + code.GetHashCode();
    if (!File.Exists(target + ".js"))
    {
        File.WriteAllText(target + ".ts", code);
        var tscCmd = "tsc --target es2017 --module commonjs " + target + ".ts";
        Console.WriteLine(tscCmd);
        var proc = new Process {
            StartInfo = new ProcessStartInfo {
                FileName = "cmd.exe",
                Arguments = "/c " + tscCmd,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            }
        };
        string stdout, stderr;
        StartCollect(proc, out stdout, out stderr);
        stderr += stdout;
        bool err = false;
        foreach (var line in stderr.Split('\n'))
            if (!line.Contains("TS2304") || !(stdout.Contains("Buffer") || stdout.Contains("process") || stdout.Contains("require")))
            {
                Console.WriteLine(line);
                err = true;
            }
        if (err)
        {
            try { File.Delete(target + ".js"); } catch {}
            throw new Exception("compilation errors occurred");
        }
        proc.WaitForExit();
    }

    {
        var input = target + "." + Environment.TickCount + ".json";
        File.WriteAllText(input, args);
        var proc = new Process {
            StartInfo = new ProcessStartInfo {
                FileName = "cmd.exe",
                Arguments = "/c node " + target + ".js " + input,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            }
        };

        string stdout, stderr;
        StartCollect(proc, out stdout, out stderr);
		if (stderr.Trim() != "")
        	throw new Exception(stderr);
        return stdout;
    }
}
}
"@



$srcTsAssem = ( "C:\Program Files\Microsoft SDKs\Azure\.NET SDK\v2.9\bin\plugins\Diagnostics\Newtonsoft.Json.dll" ) 
Add-Type -Path $srcTsAssem
Add-Type -ReferencedAssemblies $srcTsAssem -TypeDefinition $srcTsInvoke -Language CSharp

function Eval-Ts {
    [CmdletBinding()]
    Param ($code, $func, [object[]] $arg)
    PROCESS {
        $obj = New-Object PSObject
        $obj | Add-Member Noteproperty args $arg
        # Try { $arg = $obj | ConvertTo-JSON -Compress -Depth 100 } Catch { Write-Error "$([Newtonsoft.Json.JsonConvert]::SerializeObject($obj))" }
        $arg = $obj | ConvertTo-JSON -Compress -Depth 100
        If (-not $arg.StartsWith('{"args":[')) {
            $list = New-Object "System.Collections.ArrayList"
            $list.Add($arg)
            $arg = $list

            $obj = New-Object PSObject
            $obj | Add-Member Noteproperty args $arg
            $arg = $obj | ConvertTo-JSON -Compress -Depth 100
        }
        Write-Warning "TS invoke start: $func($arg)"
        $res = [NodeTs]::Eval($code, $func, $arg)
        Write-Warning "TS invoke end: $res"
        If ($res -eq "undefined") {
            return $null
        }
        return $res | ConvertFrom-JSON
    }
}