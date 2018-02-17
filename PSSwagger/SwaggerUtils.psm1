#########################################################################################
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# Licensed under the MIT license.
#
# PSSwagger Module
#
#########################################################################################


function ConvertTo-PsCustomObjectFromHashtable { 
    param ( 
        [Parameter(  
            Position = 0,   
            Mandatory = $true,   
            ValueFromPipeline = $true,  
            ValueFromPipelineByPropertyName = $true  
        )] [object[]]$hashtable 
    ); 
    
    begin { $i = 0; } 
    
    process { 
        foreach ($myHashtable in $hashtable) { 
            if ($myHashtable.GetType().Name -eq 'hashtable') { 
                $output = New-Object -TypeName PsObject; 
                Add-Member -InputObject $output -MemberType ScriptMethod -Name AddNote -Value {  
                    Add-Member -InputObject $this -MemberType NoteProperty -Name $args[0] -Value $args[1]; 
                }; 
                $myHashtable.Keys | Sort-Object | % {
                    $member = $myHashtable.$_
                    if ($member.GetType().Name -eq "PSNoteProperty") {
                        $member = $member.Value
                    }
                    $output.AddNote($_, $member);  
                } 
                $output; 
            } else { 
                Write-Warning "Index $i is not of type [hashtable]"; 
            } 
            $i += 1;  
        } 
    } 
}

function ConvertTo-HashtableFromPsCustomObject { 
     param ( 
         [Parameter(  
             Position = 0,   
             Mandatory = $true,   
             ValueFromPipeline = $true,  
             ValueFromPipelineByPropertyName = $true  
         )] [object[]]$psCustomObject 
     ); 
     
     process { 
         foreach ($myPsObject in $psCustomObject) {
             $output = @{}; 
            #  Write-Warning "VAL: $($myPsObject | ConvertTo-Json)"
             $myPsObject | Get-Member -MemberType *Property | % { 
                # Write-Warning "PROP: $($_ | ConvertTo-Json)"
                 $output.($_.name) = $myPsObject.($_.name); 
             } 
             $output; 
         } 
     } 
}
function ConvertTo-HashtableFromPsCustomObject2 { 
    param ( 
        [Parameter(  
            Position = 0,   
            Mandatory = $true,   
            ValueFromPipeline = $true,  
            ValueFromPipelineByPropertyName = $true  
        )] [object[]]$psCustomObject 
    ); 
    
    process { 
        foreach ($myPsObject in $psCustomObject) {
            $output = @{}; 
            $myPsObject | ForEach { $output[$_.Name] = $_.Value; };
            $output; 
        } 
    } 
}


Microsoft.PowerShell.Core\Set-StrictMode -Version Latest
Import-Module (Join-Path -Path $PSScriptRoot -ChildPath Utilities.psm1)
Import-Module -Name 'PSSwaggerUtility'
. "$PSScriptRoot\PSSwagger.Constants.ps1" -Force
. "$PSScriptRoot\Eval-Ts.ps1" -Force
Microsoft.PowerShell.Utility\Import-LocalizedData  LocalizedData -filename PSSwagger.Resources.psd1
$script:CmdVerbTrie = $null
$script:CSharpCodeNamer = $null

$tsc = Get-Ts

function ConvertTo-SwaggerDictionary {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $SwaggerSpecPath,

        [Parameter(Mandatory=$true)]
        [string[]]
        $SwaggerSpecFilePaths,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$false)]
        [string]
        $ModuleName,

        [Parameter(Mandatory=$false)]
        [Version]
        $ModuleVersion = '0.0.1',

        [Parameter(Mandatory=$false)]
        [AllowEmptyString()]
        [string]
        $ClientTypeName,

        [Parameter(Mandatory=$false)]
        [AllowEmptyString()]
        [string]
        $ModelsName,

        [Parameter(Mandatory = $false)]
        [string]
        $DefaultCommandPrefix,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [string]
        $Header,

        [Parameter(Mandatory = $false)]
        [switch]
        $AzureSpec,

        [Parameter(Mandatory = $false)]
        [switch]
        $DisableVersionSuffix,

        [Parameter(Mandatory = $false)]
        [hashtable]
        $PowerShellCodeGen,

        [Parameter(Mandatory = $false)]
        [PSCustomObject]
        $PSMetaJsonObject
    )
    
    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState
    $res = Eval-Ts $tsc "convertToSwaggerDictionary" $SwaggerSpecPath, $SwaggerSpecFilePaths, $DefinitionFunctionsDetails, $ModuleName, "$($ModuleVersion.Major).$($ModuleVersion.Minor).$($ModuleVersion.Build)", $ClientTypeName, $ModelsName, $DefaultCommandPrefix, $Header, $AzureSpec, $DisableVersionSuffix, $PowerShellCodeGen, $PSMetaJsonObject
    $res = ConvertTo-HashtableFromPsCustomObject $res
    return $res
}

function Get-PathParamInfo
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [PSObject]
        $JsonPathItemObject,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $SwaggerDict,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParameterGroupCache,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParametersTable,

        [Parameter(Mandatory=$false)]
        [PSCustomObject]
        $PSMetaParametersJsonObject
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $res = Eval-Ts $tsc "getPathParamInfo" $JsonPathItemObject, $SwaggerDict, $DefinitionFunctionsDetails, $ParameterGroupCache, $ParametersTable, $PSMetaParametersJsonObject
    $res = ConvertTo-HashtableFromPsCustomObject $res
    $ress = New-Object "Hashtable"
    foreach ($fred in $res.GetEnumerator()) {
        if ($fred.Value) {
            $val = ConvertTo-HashtableFromPsCustomObject $fred.Value
        } else {
            $val = $fred.Value
        }
        $ress.Add($fred.Key, $val)
    }
    return $ress
}

function Get-PathCommandName
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [string]
        $OperationId
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState
    
    $res = Eval-Ts $tsc "getPathCommandName" $OperationId
    return (ConvertTo-HashtableFromPsCustomObject $res)
}

function Test-OperationNameInDefinitionList
{
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Name,

        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $SwaggerDict
    )

    return (ConvertTo-HashtableFromPsCustomObject $SwaggerDict['Definitions']).ContainsKey($Name)
}

<#
.DESCRIPTION
    Utility function to get the parameter names declared in the Azure Resource Id (Endpoint path).
    
    Extraction logic follows the resource id guidelines provided by the Azure SDK team.
    - ResourceId should have Get, optionally other operations like Patch, Put and Delete, etc.,
    - Resource name parameter should be the last parameter in the endpoint path.

    This function also extracts the output type of Get operation, which will be used as the type of InputObject parameter.
    ResourceName return value will be used for generating alias value for Name parameter.
#>
function Get-AzureResourceIdParameters {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $JsonPathItemObject,

        [Parameter(Mandatory=$true)]
        [string]
        $ResourceId,
        
        [Parameter(Mandatory=$true)]
        [string]
        $NameSpace, 

        [Parameter(Mandatory=$true)]
        [string]
        $Models, 

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionList
    )

    return Eval-Ts $tsc "getAzureResourceIdParameters" $JsonPathItemObject, $ResourceId, $NameSpace, $Models, $DefinitionList
}

function Get-CSharpModelName
{
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Name
    )

    return (Eval-Ts $tsc "getCSharpModelName" $Name)
}

function Get-PowerShellCodeGenSettings {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Path,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $CodeGenSettings,

        [Parameter(Mandatory=$false)]
        [PSCustomObject]
        $PSMetaJsonObject
    )

    if($PSMetaJsonObject) {
        $swaggerObject = $PSMetaJsonObject
    }
    else {
        $swaggerObject = ConvertFrom-Json ((Get-Content $Path) -join [Environment]::NewLine) -ErrorAction Stop
    }
    if ((Get-Member -InputObject $swaggerObject -Name 'info') -and (Get-Member -InputObject $swaggerObject.'info' -Name 'x-ps-code-generation-settings')) {
        $props = Get-Member -InputObject $swaggerObject.'info'.'x-ps-code-generation-settings' -MemberType NoteProperty
        foreach ($prop in $props) {
            if (-not $CodeGenSettings.ContainsKey($prop.Name)) {                
                Write-Warning -Message ($LocalizedData.UnknownPSMetadataProperty -f ('x-ps-code-generation-settings', $prop.Name))
            } else {
                $CodeGenSettings[$prop.Name] = $swaggerObject.'info'.'x-ps-code-generation-settings'.$($prop.Name)
            }
        }
    }
}
