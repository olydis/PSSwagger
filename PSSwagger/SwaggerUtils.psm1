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

$tsTemplates = [System.IO.File]::ReadAllText("$PSScriptRoot\SwaggerUtils.ts")
$tsSwaggerUtils = [System.IO.File]::ReadAllText("$PSScriptRoot\SwaggerUtils.ts")
$tsLoadSwagger = [System.IO.File]::ReadAllText("$PSScriptRoot\LoadSwagger.ts")

Microsoft.PowerShell.Core\Set-StrictMode -Version Latest
Import-Module (Join-Path -Path $PSScriptRoot -ChildPath Utilities.psm1)
Import-Module -Name 'PSSwaggerUtility'
. "$PSScriptRoot\PSSwagger.Constants.ps1" -Force
. "$PSScriptRoot\Eval-Ts.ps1" -Force
Microsoft.PowerShell.Utility\Import-LocalizedData  LocalizedData -filename PSSwagger.Resources.psd1
$script:CmdVerbTrie = $null
$script:CSharpCodeNamer = $null
$script:CSharpCodeNamerLoadAttempted = $false

$script:IgnoredAutoRestParameters = @(@('Modeler', 'm'), @('AddCredentials'), @('CodeGenerator', 'g'))


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
    $res = Eval-Ts $tsLoadSwagger "convertToSwaggerDictionary" $SwaggerSpecPath, $SwaggerSpecFilePaths, $DefinitionFunctionsDetails, $ModuleName, "$($ModuleVersion.Major).$($ModuleVersion.Minor).$($ModuleVersion.Build)", $ClientTypeName, $ModelsName, $DefaultCommandPrefix, $Header, $AzureSpec, $DisableVersionSuffix, $PowerShellCodeGen, $PSMetaJsonObject
    return ConvertTo-HashtableFromPsCustomObject $res
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

    $index = (Get-HashtableKeyCount -Hashtable $ParametersTable)
    $operationId = $null
    if(Get-Member -InputObject $JsonPathItemObject -Name 'OperationId'){
        $operationId = $JsonPathItemObject.operationId
    }
    
    if(Get-Member -InputObject $JsonPathItemObject -Name 'Parameters'){
        $JsonPathItemObject.parameters | ForEach-Object {
            $AllParameterDetails = Get-ParameterDetails -ParameterJsonObject $_ `
                                                        -SwaggerDict $SwaggerDict `
                                                        -DefinitionFunctionsDetails $DefinitionFunctionsDetails `
                                                        -OperationId $operationId `
                                                        -ParameterGroupCache $ParameterGroupCache `
                                                        -PSMetaParametersJsonObject $PSMetaParametersJsonObject
            foreach ($ParameterDetails in $AllParameterDetails) {
                if($ParameterDetails -and ($ParameterDetails.ContainsKey('x_ms_parameter_grouping_group') -or $ParameterDetails.Type))
                {
                    $ParametersTable["$index"] = $ParameterDetails
                    $index = $index + 1            
                }
            }
        }
    }
}

function Get-ParameterDetails
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [PSObject]
        $ParameterJsonObject,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $SwaggerDict,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$false)]
        [string]
        $OperationId,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParameterGroupCache,

        [Parameter(Mandatory=$false)]
        [PSCustomObject]
        $PSMetaParametersJsonObject
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $NameSpace = $SwaggerDict['Info'].NameSpace
    $Models = $SwaggerDict['Info'].Models
    $DefinitionTypeNamePrefix = "$Namespace.$Models."
    $parameterName = ''
    if ((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-name') -and $ParameterJsonObject.'x-ms-client-name') {
        $parameterName = Get-PascalCasedString -Name $ParameterJsonObject.'x-ms-client-name'
    } elseif ((Get-Member -InputObject $ParameterJsonObject -Name 'Name') -and $ParameterJsonObject.Name)
    {
        $parameterName = Get-PascalCasedString -Name $ParameterJsonObject.Name
    }

    $paramTypeObject = Eval-Ts $tsLoadSwagger "getParamType" $ParameterJsonObject, "$NameSpace.$Models", $parameterName, $SwaggerDict, $DefinitionFunctionsDetails

    # Swagger Path Operations can be defined with reference to the global method based parameters.
    # Add the method based global parameters as a function parameter.
    $AllParameterDetailsArrayTemp = @()
    $x_ms_parameter_grouping = ''
    if($paramTypeObject.GlobalParameterDetails)
    {
        $ParameterDetails = $paramTypeObject.GlobalParameterDetails
        $x_ms_parameter_grouping = $ParameterDetails.'x_ms_parameter_grouping'
    }
    else
    {
        $IsParamMandatory = '$false'
        $ParameterDescription = ''
        $x_ms_parameter_location = 'method'

        if ((Get-Member -InputObject $ParameterJsonObject -Name 'Required') -and 
            $ParameterJsonObject.Required)
        {
            $IsParamMandatory = '$true'
        }

        if ((Get-Member -InputObject $ParameterJsonObject -Name 'Description') -and 
            $ParameterJsonObject.Description)
        {
            $ParameterDescription = $ParameterJsonObject.Description
        }

        if ($OperationId -and (Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-parameter-grouping')) {
            $groupObject = $ParameterJsonObject.'x-ms-parameter-grouping'
            if (Get-Member -InputObject $groupObject -Name 'name') {
                $parsedName = Get-ParameterGroupName -RawName $groupObject.name
            } elseif (Get-Member -InputObject $groupObject -Name 'postfix') {
                $parsedName = Get-ParameterGroupName -OperationId $OperationId -Postfix $groupObject.postfix
            } else {
                $parsedName = Get-ParameterGroupName -OperationId $OperationId
            }

            $x_ms_parameter_grouping = $parsedName
        }

        $FlattenOnPSCmdlet = $false
        if($PSMetaParametersJsonObject -and 
          (Get-Member -InputObject $PSMetaParametersJsonObject -Name $parameterName) -and
          (Get-Member -InputObject $PSMetaParametersJsonObject.$parameterName -Name 'x-ps-parameter-info') -and
          (Get-Member -InputObject $PSMetaParametersJsonObject.$parameterName.'x-ps-parameter-info' -Name 'flatten')) {
            $FlattenOnPSCmdlet = $PSMetaParametersJsonObject.$parameterName.'x-ps-parameter-info'.'flatten'
        }

        $ParameterDetails = @{
            Name = $parameterName
            Type = $paramTypeObject.ParamType
            ValidateSet = $paramTypeObject.ValidateSetString
            Mandatory = $IsParamMandatory
            Description = $ParameterDescription
            IsParameter = $paramTypeObject.IsParameter
            x_ms_parameter_location = $x_ms_parameter_location
            x_ms_parameter_grouping = $x_ms_parameter_grouping
            OriginalParameterName = $ParameterJsonObject.Name
            FlattenOnPSCmdlet = $FlattenOnPSCmdlet
        }
    }

    if ((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-flatten') -and $ParameterJsonObject.'x-ms-client-flatten') {
        $referenceTypeName = $ParameterDetails.Type.Replace($DefinitionTypeNamePrefix, '')
        # If the parameter should be flattened, return an array of parameter detail objects for each parameter of the referenced definition
        Write-Verbose -Message ($LocalizedData.FlatteningParameterType -f ($parameterName, $referenceTypeName))
        $AllParameterDetails = @{}
        Expand-Parameters -ReferenceTypeName $referenceTypeName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
        foreach ($expandedParameterDetail in $AllParameterDetails.GetEnumerator()) {
            Write-Verbose -Message ($LocalizedData.ParameterExpandedTo -f ($parameterName, $expandedParameterDetail.Key))
            $AllParameterDetailsArrayTemp += $expandedParameterDetail.Value
        }
    } else {
        # If the parameter shouldn't be flattened, just return the original parameter detail object
        $AllParameterDetailsArrayTemp += $ParameterDetails
    }

    # Loop through the parameters in case they belong to different groups after being expanded
    $AllParameterDetailsArray = @()
    foreach ($expandedParameterDetail in $AllParameterDetailsArrayTemp) {
        # The parent parameter object, wherever it is, set a grouping name
        if ($x_ms_parameter_grouping) {
            $expandedParameterDetail.'x_ms_parameter_grouping' = $x_ms_parameter_grouping
            # An empty parameter details object is created that contains all known parameters in this group
            if ($ParameterGroupCache.ContainsKey($x_ms_parameter_grouping)) {
                $ParameterDetails = $ParameterGroupCache[$x_ms_parameter_grouping]
            } else {
                $ParameterDetails = @{
                    Name = $x_ms_parameter_grouping
                    x_ms_parameter_grouping_group = @{}
                    IsParameter = $true
                }
            }

            if (-not $ParameterDetails.'x_ms_parameter_grouping_group'.ContainsKey($expandedParameterDetail.Name)) {
                $ParameterDetails.'x_ms_parameter_grouping_group'[$expandedParameterDetail.Name] = $expandedParameterDetail
            }

            $AllParameterDetailsArray += $ParameterDetails
            $ParameterGroupCache[$x_ms_parameter_grouping] = $ParameterDetails
        } else {
            $AllParameterDetailsArray += $expandedParameterDetail
        }
    }

    # Properties of ParameterDetails object
    # .x_ms_parameter_grouping - string - non-empty if this is part of a group, contains the group's parsed name (should be the C# Type name)
    # .x_ms_parameter_grouping_group - hashtable - table of parameter names to ParameterDetails, indicates this ParameterDetails object is a grouping
    return $AllParameterDetailsArray
}

function Expand-Parameters {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [string]
        $ReferenceTypeName,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $AllParameterDetails
    )

    # Expand unexpanded x-ms-client-flatten
    # Leave it unexpanded afterwards
    if ($DefinitionFunctionsDetails[$ReferenceTypeName].ContainsKey('Unexpanded_x_ms_client_flatten_DefinitionNames') -and
        ($DefinitionFunctionsDetails[$ReferenceTypeName].'Unexpanded_x_ms_client_flatten_DefinitionNames'.Count -gt 0)) {
        foreach ($unexpandedDefinitionName in $DefinitionFunctionsDetails[$ReferenceTypeName].'Unexpanded_x_ms_client_flatten_DefinitionNames') {
            if ($DefinitionFunctionsDetails[$unexpandedDefinitionName].ContainsKey('ExpandedParameters') -and -not $DefinitionFunctionsDetails[$unexpandedDefinitionName].ExpandedParameters) {
                Expand-Parameters -ReferenceTypeName $unexpandedDefinitionName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
            }

            Flatten-ParameterTable -ReferenceTypeName $unexpandedDefinitionName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
        }
    }

    Flatten-ParameterTable -ReferenceTypeName $ReferenceTypeName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
}

<#
.DESCRIPTION
   Flattens the given type's parameter table into cmdlet parameters.
#>
function Flatten-ParameterTable {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $ReferenceTypeName,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $AllParameterDetails
    )
    foreach ($parameterEntry in $DefinitionFunctionsDetails[$ReferenceTypeName]['ParametersTable'].GetEnumerator()) {
        if ($AllParameterDetails.ContainsKey($parameterEntry.Key)) {
            throw $LocalizedData.DuplicateExpandedProperty -f ($parameterEntry.Key)
        }

        $AllParameterDetails[$parameterEntry.Key] = Clone-ParameterDetail -ParameterDetail $parameterEntry.Value -OtherEntries @{'IsParameter'=$true}
    }
}

<#
.DESCRIPTION
   Clones a given parameter detail object by shallow copying all properties. Optionally adds additional entries.
#>
function Clone-ParameterDetail {
    param(
        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParameterDetail,

        [Parameter(Mandatory=$false)]
        [hashtable]
        $OtherEntries
    )

    $clonedParameterDetail = @{}
    foreach ($kvp in $ParameterDetail.GetEnumerator()) {
        $clonedParameterDetail[$kvp.Key] = $kvp.Value
    }

    foreach ($kvp in $OtherEntries.GetEnumerator()) {
        $clonedParameterDetail[$kvp.Key] = $kvp.Value
    }

    return $clonedParameterDetail
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
    
    $res = Eval-Ts $tsSwaggerUtils "getPathCommandName" $OperationId
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

    return Eval-Ts $tsSwaggerUtils "getAzureResourceIdParameters" $JsonPathItemObject, $ResourceId, $NameSpace, $Models, $DefinitionList
}

function Get-CSharpModelName
{
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Name
    )

    return (Eval-Ts $tsSwaggerUtils "getCSharpModelName" $Name)
}

<# Create an object from an external dependency with possible type name changes. Optionally resolve the external dependency using a delegate.
Input to $AssemblyResolver is $AssemblyName.
Doesn't support constructors with args currently. #>
function New-ObjectFromDependency {
    param(
        [Parameter(Mandatory=$true)]
        [string[]]
        $TypeNames,

        [Parameter(Mandatory=$true)]
        [string]
        $AssemblyName,

        [Parameter(Mandatory=$false)]
        [System.Action[string]]
        $AssemblyResolver
    )

    if ($TypeNames.Count -gt 0) {
        $assemblyLoadAttempted = $false
        foreach ($typeName in $TypeNames) {
            if (-not ($typeName -as [Type])) {
                if (-not $assemblyLoadAttempted) {
                    if ($AssemblyResolver -ne $null) {
                        $AssemblyResolver.Invoke($AssemblyName)
                    } else {
                        $null = Add-Type -Path $AssemblyName
                    }

                    $assemblyLoadAttempted = $true
                }
            } else {
                return New-Object -TypeName $typeName
            }
        }
    }

    return $null
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
