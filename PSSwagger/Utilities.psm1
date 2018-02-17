#########################################################################################
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# Licensed under the MIT license.
#
# PSSwagger Module
#
#########################################################################################

Import-Module -Name "$PSScriptRoot\Eval-Ts.ps1" -Force


$tsc = "
$([System.IO.File]::ReadAllText("$PSScriptRoot\Utilities.ts"))`n
$([System.IO.File]::ReadAllText("$PSScriptRoot\SwaggerUtils.ts"))`n
$([System.IO.File]::ReadAllText("$PSScriptRoot\LoadSwagger.ts"))`n
"

function Get-Ts() {
    return $tsc
}

function Get-PascalCasedString
{
    param([string] $Name)

    return (Eval-Ts $tsc "getPascalCasedString" $Name)
}

<#
.DESCRIPTION
    Some hashtables can have 'Count' as a key value, 
    in that case, $Hashtable.Count return the value rather than hashtable keys count in PowerShell.
    This utility uses enumerator to count the number of keys in a hashtable.
#>
function Get-HashtableKeyCount
{
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $Hashtable
    )

    $KeyCount = 0
    $Hashtable.GetEnumerator() | ForEach-Object { $KeyCount++ }
    return $KeyCount
}

<#
.DESCRIPTION
    This function is a helper function for any script module Advanced Function.
    Fetches "Preference" variable values from the caller's scope and sets them locally.
    Script module functions do not automatically inherit their caller's variables, but they can be
    obtained through the $PSCmdlet variable in Advanced Functions.
.PARAMETER Cmdlet
    The $PSCmdlet object from a script module Advanced Function.
.PARAMETER SessionState
    The $ExecutionContext.SessionState object from a script module Advanced Function. 
#>
function Get-CallerPreference
{
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true)]
        [ValidateScript({ $_.GetType().FullName -eq 'System.Management.Automation.PSScriptCmdlet' })]
        $Cmdlet,

        [Parameter(Mandatory = $true)]
        [System.Management.Automation.SessionState]
        $SessionState
    )

    # List of preference variables
    $Variables = @{
        'ErrorActionPreference' = 'ErrorAction'
        'DebugPreference' = 'Debug'
        'ConfirmPreference' = 'Confirm'
        'WhatIfPreference' = 'WhatIf'
        'VerbosePreference' = 'Verbose'
        'WarningPreference' = 'WarningAction'
        'ProgressPreference' = $null
        'PSDefaultParameterValues' = $null
    }

    $Variables.GetEnumerator() | ForEach-Object {
        $VariableName = $_.Name
        $VariableValue = $_.Value

        if (-not $VariableValue -or
            -not $Cmdlet.MyInvocation.BoundParameters.ContainsKey($VariableValue))
        {
            $Variable = $Cmdlet.SessionState.PSVariable.Get($VariableName)
            if ($Variable)
            {
                if ($SessionState -eq $ExecutionContext.SessionState)
                {
                    $params = @{
                        Scope = 1
                        Name = $Variable.Name
                        Value = $Variable.Value
                        Force = $true
                        Confirm = $false
                        WhatIf = $false
                    }
                    Set-Variable @params
                }
                else
                {
                    $SessionState.PSVariable.Set($Variable.Name, $Variable.Value)
                }
            }
        }
    }
}