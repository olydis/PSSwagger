$srcTsInvoke = @"
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Management.Automation;

public static class NodeTs
{
public static object Eval(string code, string func, string args)
{
    code = code + ";\n console.log(JSON.stringify(" + func + ".apply(null, require(process.argv.reverse()[0]).args)))";

    string target = Path.GetTempPath() + "ts" + code.GetHashCode();
    if (!File.Exists(target + ".js"))
    {
        File.WriteAllText(target + ".ts", code);
        var proc = new Process {
            StartInfo = new ProcessStartInfo {
                FileName = "cmd.exe",
                Arguments = "/c tsc --target es2017 --module commonjs " + target + ".ts",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            }
        };
        proc.Start();
		string stderr = "";
        while (!proc.StandardError.EndOfStream)
        {
            stderr += proc.StandardError.ReadLine() + "\n";
        }
        while (!proc.StandardOutput.EndOfStream)
        {
			var stdout = proc.StandardOutput.ReadLine() + "\n";
            if (stdout.Contains("TS2304"))
                if (stdout.Contains("Buffer") || stdout.Contains("process") || stdout.Contains("require"))
                    continue;
            stderr += stdout;
        }
        if (stderr.Trim() != "")
        {
            try { File.Delete(target + ".js"); } catch {}
            throw new Exception(stderr);
        }
        proc.WaitForExit();
    }

    {
        File.WriteAllText(target + ".json", args);
        var proc = new Process {
            StartInfo = new ProcessStartInfo {
                FileName = "cmd.exe",
                Arguments = "/c node " + target + ".js " + target + ".json",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            }
        };
        proc.Start();

		string stderr = "";
        while (!proc.StandardError.EndOfStream)
        {
            stderr += proc.StandardError.ReadLine() + "\n";
        }
		if (stderr.Trim() != "")
        	throw new Exception(stderr);

        string line = "null";
        while (!proc.StandardOutput.EndOfStream)
        {
            line = proc.StandardOutput.ReadLine();
        }
        proc.WaitForExit();
        return line;
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