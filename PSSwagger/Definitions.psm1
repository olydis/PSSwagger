#########################################################################################
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# Licensed under the MIT license.
#
# PSSwagger Module
#
#########################################################################################

Microsoft.PowerShell.Core\Set-StrictMode -Version Latest
Import-Module (Join-Path -Path $PSScriptRoot -ChildPath Utilities.psm1) -DisableNameChecking
Import-Module (Join-Path -Path $PSScriptRoot -ChildPath SwaggerUtils.psm1) -DisableNameChecking
. "$PSScriptRoot\PSSwagger.Constants.ps1" -Force
. "$PSScriptRoot\Eval-Ts.ps1" -Force
Microsoft.PowerShell.Utility\Import-LocalizedData  LocalizedData -filename PSSwagger.Resources.psd1

$tsc = Get-Ts

<#
.DESCRIPTION
  Gets Definition function details.
#>
function Get-SwaggerSpecDefinitionInfo
{
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [PSObject]
        $JsonDefinitionItemObject,

        [Parameter(Mandatory=$true)]
        [PSCustomObject] 
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [string] 
        $Namespace,

        [Parameter(Mandatory=$true)]
        [string] 
        $Models
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $Name = Get-CSharpModelName -Name $JsonDefinitionItemObject.Name
    $FunctionDescription = ""
    if((Get-Member -InputObject $JsonDefinitionItemObject.Value -Name 'Description') -and 
       $JsonDefinitionItemObject.Value.Description)
    {
        $FunctionDescription = $JsonDefinitionItemObject.Value.Description
    }

    $AllOf_DefinitionNames = @()
    $ParametersTable = @{}
    $isModel = $false
    $AllOf_InlineObjects = @()
    if((Get-Member -InputObject $JsonDefinitionItemObject.Value -Name 'AllOf') -and 
       $JsonDefinitionItemObject.Value.'AllOf')
    {
       $JsonDefinitionItemObject.Value.'AllOf' | ForEach-Object {
            if(Get-Member -InputObject $_ -Name '$ref')
            {
                $AllOfRefFullName = $_.'$ref'
                $AllOfRefName = Get-CSharpModelName -Name $AllOfRefFullName.Substring( $( $AllOfRefFullName.LastIndexOf('/') ) + 1 )
                $AllOf_DefinitionNames += $AllOfRefName
                            
                $ReferencedFunctionDetails = @{}
                if($DefinitionFunctionsDetails.ContainsKey($AllOfRefName))
                {
                    $ReferencedFunctionDetails = $DefinitionFunctionsDetails[$AllOfRefName]
                }

                $ReferencedFunctionDetails['Name'] = $AllOfRefName
                $ReferencedFunctionDetails['IsUsedAs_AllOf'] = $true

                $DefinitionFunctionsDetails[$AllOfRefName] = $ReferencedFunctionDetails
            } elseif ((Get-Member -InputObject $_ -Name 'type') -and $_.type -eq 'object') {
                # Create an anonymous type for objects defined inline
                $anonObjName = Get-CSharpModelName -Name ([Guid]::NewGuid().Guid)
                [PSCustomObject]$obj = New-Object -TypeName PsObject
                Add-Member -InputObject $obj -MemberType NoteProperty -Name 'Name' -Value $anonObjName
                Add-Member -InputObject $obj -MemberType NoteProperty -Name 'Value' -Value $_
                Get-SwaggerSpecDefinitionInfo -JsonDefinitionItemObject $obj -DefinitionFunctionsDetails $DefinitionFunctionsDetails -Namespace $Namespace -Models $Models
                $DefinitionFunctionsDetails[$anonObjName]['IsUsedAs_AllOf'] = $true
                $DefinitionFunctionsDetails[$anonObjName]['IsModel'] = $false
                $AllOf_InlineObjects += $DefinitionFunctionsDetails[$anonObjName]
                $isModel = $true
            }
            else {
                $Message = $LocalizedData.UnsupportedSwaggerProperties -f ('JsonDefinitionItemObject', $($_ | Out-String))
                Write-Warning -Message $Message
            }
       }
    }

    Get-DefinitionParameters -JsonDefinitionItemObject $JsonDefinitionItemObject `
                             -DefinitionFunctionsDetails $DefinitionFunctionsDetails `
                             -DefinitionName $Name `
                             -Namespace $Namespace `
                             -ParametersTable $ParametersTable `
                             -Models $Models

    # AutoRest doesn't generate a property for a discriminator property
    if((Get-Member -InputObject $JsonDefinitionItemObject.Value -Name 'discriminator') -and 
       $JsonDefinitionItemObject.Value.'discriminator')
    {
        $discriminator = $JsonDefinitionItemObject.Value.'discriminator'
        if ($ParametersTable.ContainsKey($discriminator)) {
            $ParametersTable[$discriminator]['Discriminator'] = $true
        }
    }

    $FunctionDetails = @{}
    $x_ms_Client_flatten_DefinitionNames = @()
    if($DefinitionFunctionsDetails.ContainsKey($Name))
    {
        $FunctionDetails = $DefinitionFunctionsDetails[$Name]

        if($FunctionDetails.ContainsKey('x_ms_Client_flatten_DefinitionNames'))
        {
            $x_ms_Client_flatten_DefinitionNames = $FunctionDetails.x_ms_Client_flatten_DefinitionNames
        }
    }

    $Unexpanded_AllOf_DefinitionNames = $AllOf_DefinitionNames
    $Unexpanded_x_ms_client_flatten_DefinitionNames = $x_ms_Client_flatten_DefinitionNames
    $ExpandedParameters = (-not $Unexpanded_AllOf_DefinitionNames -and -not $Unexpanded_x_ms_client_flatten_DefinitionNames)

    $FunctionDetails['Name'] = $Name
    $FunctionDetails['Description'] = $FunctionDescription
    # Definition doesn't have Summary property, so using specifying Description as Function Synopsis.
    $FunctionDetails['Synopsis'] = $FunctionDescription
    $FunctionDetails['ParametersTable'] = $ParametersTable
    $FunctionDetails['x_ms_Client_flatten_DefinitionNames'] = $x_ms_Client_flatten_DefinitionNames
    $FunctionDetails['AllOf_DefinitionNames'] = $AllOf_DefinitionNames
    $FunctionDetails['Unexpanded_x_ms_client_flatten_DefinitionNames'] = $Unexpanded_x_ms_client_flatten_DefinitionNames
    $FunctionDetails['Unexpanded_AllOf_DefinitionNames'] = $Unexpanded_AllOf_DefinitionNames
    $FunctionDetails['ExpandedParameters'] = $ExpandedParameters

    $DefinitionType = ""
    $ValidateSet = $null
    if ((Get-HashtableKeyCount -Hashtable $ParametersTable) -lt 1)
    {
        $GetDefinitionParameterType_params = @{
            ParameterJsonObject = $JsonDefinitionItemObject.value
            DefinitionName = $Name
            ModelsNamespace = "$NameSpace.$Models"
            DefinitionFunctionsDetails = $DefinitionFunctionsDetails
        }
        $TypeResult = Get-DefinitionParameterType @GetDefinitionParameterType_params
        $DefinitionType = $TypeResult['ParameterType']
        $ValidateSet = $TypeResult['ValidateSet']
    }
    $FunctionDetails['Type'] = $DefinitionType
    $FunctionDetails['ValidateSet'] = $ValidateSet

    if(-not $FunctionDetails.ContainsKey('IsUsedAs_x_ms_client_flatten'))
    {
        $FunctionDetails['IsUsedAs_x_ms_client_flatten'] = $false
    }

    if(-not $FunctionDetails.ContainsKey('IsUsedAs_AllOf'))
    {
        $FunctionDetails['IsUsedAs_AllOf'] = $false
    }

    if((Get-Member -InputObject $JsonDefinitionItemObject -Name Value) -and
       (Get-Member -InputObject $JsonDefinitionItemObject.Value -Name properties) -and
       ((Get-HashtableKeyCount -Hashtable $JsonDefinitionItemObject.Value.Properties.PSObject.Properties) -ge 1))
    {
        $isModel = $true
    }

    $FunctionDetails['IsModel'] = $isModel
    $AllOf_InlineObjects | ForEach-Object {
        Copy-FunctionDetailsParameters -RefFunctionDetails $_ -FunctionDetails $FunctionDetails
    }
    
    $DefinitionFunctionsDetails[$Name] = $FunctionDetails
}

function Get-DefinitionParameters
{
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [PSObject]
        $JsonDefinitionItemObject,

        [Parameter(Mandatory=$true)]
        [PSCustomObject] 
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [string] 
        $DefinitionName,

        [Parameter(Mandatory=$true)]
        [string] 
        $Namespace,

        [Parameter(Mandatory=$true)]
        [string] 
        $Models,

        [Parameter(Mandatory=$true)]
        [PSCustomObject] 
        $ParametersTable
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState
    if((Get-Member -InputObject $JsonDefinitionItemObject -Name Value) -and
       (Get-Member -InputObject $JsonDefinitionItemObject.Value -Name properties))
    {
        $JsonDefinitionItemObject.Value.properties.PSObject.Properties | ForEach-Object {

            if((Get-Member -InputObject $_ -Name 'Name') -and $_.Name)
            {                
                $ParameterJsonObject = $_.Value
                if ((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-name') -and $ParameterJsonObject.'x-ms-client-name') {
                    $parameterName = Get-PascalCasedString -Name $ParameterJsonObject.'x-ms-client-name'
                } else {
                    $ParameterName = Get-PascalCasedString -Name $_.Name
                }

                if(($ParameterName -eq 'Properties') -and
                   (Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-flatten') -and
                   ($ParameterJsonObject.'x-ms-client-flatten') -and
                   (Get-Member -InputObject $ParameterJsonObject -Name 'properties'))
                {
                    # Flatten the properties with x-ms-client-flatten
                    $null = Get-DefinitionParameters -JsonDefinitionItemObject $_ `
                                                     -DefinitionName $DefinitionName `
                                                     -Namespace $Namespace `
                                                     -DefinitionFunctionsDetails $DefinitionFunctionsDetails `
                                                     -ParametersTable $ParametersTable `
                                                     -Models $Models
                }
                else
                {
                    $ParameterDetails = @{}
                    $IsParamMandatory = '$false'
                    $ValidateSetString = $null
                    $ParameterDescription = ''
                    
                    $GetDefinitionParameterType_params = @{
                        ParameterJsonObject        = $ParameterJsonObject
                        DefinitionName             = $DefinitionName
                        ParameterName              = $ParameterName
                        DefinitionFunctionsDetails = $DefinitionFunctionsDetails
                        ModelsNamespace            = "$NameSpace.Models"
                        ParametersTable            = $ParametersTable
                    }
                    $TypeResult = Get-DefinitionParameterType @GetDefinitionParameterType_params
            
                    $ParameterType = $TypeResult['ParameterType']
                    if($TypeResult['ValidateSet']) {
                        $ValidateSetString = "'$($TypeResult['ValidateSet'] -join "', '")'"
                    }
                    if ((Get-Member -InputObject $JsonDefinitionItemObject.Value -Name 'Required') -and 
                        $JsonDefinitionItemObject.Value.Required -and
                        ($JsonDefinitionItemObject.Value.Required -contains $ParameterName) )
                    {
                        $IsParamMandatory = '$true'
                    }

                    if ((Get-Member -InputObject $ParameterJsonObject -Name 'Enum') -and $ParameterJsonObject.Enum)
                    {
                        if(-not ((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-enum') -and 
                                 $ParameterJsonObject.'x-ms-enum' -and 
                                 (-not (Get-Member -InputObject $ParameterJsonObject.'x-ms-enum' -Name 'modelAsString') -or
                                 ($ParameterJsonObject.'x-ms-enum'.modelAsString -eq $false))))
                        {
                            $EnumValues = $ParameterJsonObject.Enum | ForEach-Object {$_ -replace "'","''"}
                            $ValidateSetString = "'$($EnumValues -join "', '")'"
                        }
                    }

                    if ((Get-Member -InputObject $ParameterJsonObject -Name 'Description') -and $ParameterJsonObject.Description)
                    {
                        $ParameterDescription = $ParameterJsonObject.Description
                    }

                    $ParameterDetails['Name'] = $ParameterName
                    $ParameterDetails['Type'] = $ParameterType
                    $ParameterDetails['ValidateSet'] = $ValidateSetString
                    $ParameterDetails['Mandatory'] = $IsParamMandatory
                    $ParameterDetails['Description'] = $ParameterDescription
                    $ParameterDetails['OriginalParameterName'] = $_.Name

                    if($ParameterType)
                    {
                        $ParametersTable[$ParameterName] = $ParameterDetails
                    }
                }
            }
        } #Properties
    }
}

function Get-DefinitionParameterType
{
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [PSObject]
        $ParameterJsonObject,

        [Parameter(Mandatory=$true)]
        [string]
        $DefinitionName,

        [Parameter(Mandatory=$false)]
        [string]
        $ParameterName,

        [Parameter(Mandatory=$true)]
        [PSCustomObject] 
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [string] 
        $ModelsNamespace,

        [Parameter(Mandatory=$false)]
        [PSCustomObject] 
        $ParametersTable = @{}
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $res = Eval-Ts $tsc "getDefinitionParameterType" $ParameterJsonObject, $DefinitionName, $ParameterName, $DefinitionFunctionsDetails, $ModelsNamespace, $ParametersTable

    return ConvertTo-HashtableFromPsCustomObject $res
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

function Expand-SwaggerDefinition
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory = $true)]
        [string]
        $NameSpace,

        [Parameter(Mandatory = $true)]
        [string]
        $Models
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    # Expand the definition parameters from 'AllOf' definitions and x_ms_client-flatten declarations.
    $ExpandedAllDefinitions = $false

    while(-not $ExpandedAllDefinitions)
    {
        $ExpandedAllDefinitions = $true

        $DefinitionFunctionsDetails.GetEnumerator() | ForEach-Object {
            
            $FunctionDetails = $_.Value

            if(-not $FunctionDetails.ExpandedParameters)
            {
                $message = $LocalizedData.ExpandDefinition -f ($FunctionDetails.Name)
                Write-Verbose -Message $message

                $Unexpanded_AllOf_DefinitionNames = @()
                $Unexpanded_AllOf_DefinitionNames += $FunctionDetails.Unexpanded_AllOf_DefinitionNames | ForEach-Object {
                                                        $ReferencedDefinitionName = $_
                                                        if($DefinitionFunctionsDetails.ContainsKey($ReferencedDefinitionName) -and
                                                           $DefinitionFunctionsDetails[$ReferencedDefinitionName].ExpandedParameters)
                                                        {
                                                            $RefFunctionDetails = $DefinitionFunctionsDetails[$ReferencedDefinitionName]
                                                            $RefFunctionDetails.ParametersTable.GetEnumerator() | ForEach-Object {
                                                                $RefParameterName = $_.Name
                                                                if($RefParameterName)
                                                                {
                                                                    if($FunctionDetails.ParametersTable.ContainsKey($RefParameterName))
                                                                    {
                                                                        Write-Verbose -Message ($LocalizedData.SamePropertyName -f ($RefParameterName, $FunctionDetails.Name))
                                                                    }
                                                                    else
                                                                    {
                                                                        $FunctionDetails.ParametersTable[$RefParameterName] = $RefFunctionDetails.ParametersTable[$RefParameterName]
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        else
                                                        {
                                                            $_
                                                        }
                                                    }
                $Unexpanded_x_ms_client_flatten_DefinitionNames = @()
                $Unexpanded_x_ms_client_flatten_DefinitionNames += $FunctionDetails.Unexpanded_x_ms_client_flatten_DefinitionNames | ForEach-Object {
                                                                        $ReferencedDefinitionName = $_
                                                                        if($ReferencedDefinitionName)
                                                                        {
                                                                            if($DefinitionFunctionsDetails.ContainsKey($ReferencedDefinitionName) -and
                                                                               $DefinitionFunctionsDetails[$ReferencedDefinitionName].ExpandedParameters)
                                                                            {
                                                                                $RefFunctionDetails = $DefinitionFunctionsDetails[$ReferencedDefinitionName]
                                                                                Copy-FunctionDetailsParameters -RefFunctionDetails $RefFunctionDetails -FunctionDetails $FunctionDetails
                                                                            }
                                                                            else
                                                                            {
                                                                                $_
                                                                            }
                                                                        }
                                                                    }


                $FunctionDetails.ExpandedParameters = (-not $Unexpanded_AllOf_DefinitionNames -and -not $Unexpanded_x_ms_client_flatten_DefinitionNames)
                $FunctionDetails.Unexpanded_AllOf_DefinitionNames = $Unexpanded_AllOf_DefinitionNames
                $FunctionDetails.Unexpanded_x_ms_client_flatten_DefinitionNames = $Unexpanded_x_ms_client_flatten_DefinitionNames

                if(-not $FunctionDetails.ExpandedParameters)
                {
                    $message = $LocalizedData.UnableToExpandDefinition -f ($FunctionDetails.Name)
                    Write-Verbose -Message $message
                    $ExpandedAllDefinitions = $false
                }
            } # ExpandedParameters
        } # Foeach-Object
    } # while()

    Expand-NonModelDefinition -DefinitionFunctionsDetails $DefinitionFunctionsDetails -NameSpace $NameSpace -Models $Models

    $DefinitionFunctionsDetails.GetEnumerator() | ForEach-Object {
        $FunctionDetails = $_.Value
        if ($FunctionDetails.ContainsKey('UsedAsPathOperationInputType') -and $FunctionDetails.UsedAsPathOperationInputType) {
            Set-GenerateDefinitionCmdlet -DefinitionFunctionsDetails $DefinitionFunctionsDetails -FunctionDetails $FunctionDetails -ModelsNamespaceWithDot "$Namespace.$Models."
        }
    }
}

function New-SwaggerDefinitionCommand
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $SwaggerMetaDict,

        [Parameter(Mandatory = $true)]
        [string]
        $NameSpace,

        [Parameter(Mandatory = $true)]
        [string]
        $Models,
        
        [Parameter(Mandatory=$false)]
        [AllowEmptyString()]
        [string]
        $HeaderContent
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState
    return Eval-Ts $tsc "newSwaggerDefinitionCommand" $DefinitionFunctionsDetails, $SwaggerMetaDict, $NameSpace, $Models, $HeaderContent
}

function Set-GenerateDefinitionCmdlet
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $FunctionDetails,

        [Parameter(Mandatory = $true)]
        [string]
        $ModelsNamespaceWithDot
    )

    if($FunctionDetails.ContainsKey('GenerateDefinitionCmdlet') -or -not $FunctionDetails.IsModel)
    {
        return
    }
    $FunctionDetails['GenerateDefinitionCmdlet'] = $true
    
    if($FunctionDetails.ContainsKey('ParametersTable') -and (Get-HashtableKeyCount -Hashtable $FunctionDetails.ParametersTable)) {
        $FunctionDetails.ParametersTable.GetEnumerator() | ForEach-Object {
            Set-GenerateDefinitionCmdletUtility -ParameterType $_.Value.Type -DefinitionFunctionsDetails $DefinitionFunctionsDetails -ModelsNamespaceWithDot $ModelsNamespaceWithDot
        }
    } elseif ($FunctionDetails.ContainsKey('Type') -and $FunctionDetails.Type) {
        Set-GenerateDefinitionCmdletUtility -ParameterType $FunctionDetails.Type -DefinitionFunctionsDetails $DefinitionFunctionsDetails -ModelsNamespaceWithDot $ModelsNamespaceWithDot
    }
}

function Set-GenerateDefinitionCmdletUtility
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory = $true)]
        [string]
        $ParameterType,

        [Parameter(Mandatory = $true)]
        [string]
        $ModelsNamespaceWithDot
    )

    $RefDefName = $null
    if ($ParameterType.StartsWith($ModelsNamespaceWithDot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $RefDefName = $ParameterType.Replace($ModelsNamespaceWithDot, '').Replace('[]','')
    } elseif ($ParameterType.StartsWith("System.Collections.Generic.Dictionary[[string],[$ModelsNamespaceWithDot", [System.StringComparison]::OrdinalIgnoreCase)) {
        $RefDefName = $ParameterType.Replace("System.Collections.Generic.Dictionary[[string],[$ModelsNamespaceWithDot", '').Replace(']]','')
    }

    if($RefDefName -and $DefinitionFunctionsDetails.ContainsKey($RefDefName)) {
        $RefDefFunctionDetails = $DefinitionFunctionsDetails[$RefDefName]
        if($RefDefFunctionDetails) {
            Set-GenerateDefinitionCmdlet -FunctionDetails $RefDefFunctionDetails -DefinitionFunctionsDetails $DefinitionFunctionsDetails -ModelsNamespaceWithDot $ModelsNamespaceWithDot
        }
    }
}

function Copy-FunctionDetailsParameters {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $RefFunctionDetails,

        [Parameter(Mandatory = $true)]
        $FunctionDetails
    )

    $RefFunctionDetails.ParametersTable.GetEnumerator() | ForEach-Object {
                                                                $RefParameterName = $_.Name
                                                                if($RefParameterName)
                                                                {
                                                                    if($FunctionDetails.ParametersTable.ContainsKey($RefParameterName))
                                                                    {
                                                                        Write-Verbose -Message ($LocalizedData.SamePropertyName -f ($RefParameterName, $FunctionDetails.Name))
                                                                    }
                                                                    else
                                                                    {
                                                                        $FunctionDetails.ParametersTable[$RefParameterName] = $RefFunctionDetails.ParametersTable[$RefParameterName]
                                                                    }
                                                                }
                                                            }
}
function Expand-NonModelDefinition
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory = $true)]
        [string]
        $NameSpace,

        [Parameter(Mandatory = $true)]
        [string]
        $Models
    )

    $DefinitionFunctionsDetails.GetEnumerator() | ForEach-Object {
        $DefFunctionDetails = $_.Value 

        if(-not $DefFunctionDetails.IsModel) {
            # Replace parameter details from referenced definition details.
            $DefinitionFunctionsDetails.GetEnumerator() | ForEach-Object {
                $FunctionDetails = $_.Value
                $ParamsToBeReplaced = @{}
                if($DefFunctionDetails.ContainsKey('ParametersTable') -and 
                    ((Get-HashtableKeyCount -Hashtable $DefFunctionDetails.ParametersTable) -eq 1)) {
                    $DefFunctionDetails.ParametersTable.GetEnumerator() | ForEach-Object { $SourceDetails = $_.Value }
                } else {
                    $SourceDetails = $DefFunctionDetails
                }

                if(Get-HashtableKeyCount -Hashtable $FunctionDetails.ParametersTable)
                {
                    $FunctionDetails.ParametersTable.GetEnumerator() | ForEach-Object {
                        $ParameterDetails = $_.Value
                        if (($ParameterDetails.Type -eq "$Namespace.$Models.$($DefFunctionDetails.Name)") -or
                            ($ParameterDetails.Type -eq "$Namespace.$Models.$($DefFunctionDetails.Name)[]")) {
                            
                            if($SourceDetails.ContainsKey('Type')) {
                                if($ParameterDetails.Type -eq "$Namespace.$Models.$($DefFunctionDetails.Name)[]") {
                                    $ParameterDetails['Type'] = $SourceDetails.Type + '[]'
                                }
                                else {
                                    $ParameterDetails['Type'] = $SourceDetails.Type
                                }
                            }

                            if($SourceDetails.ContainsKey('ValidateSet')) {
                                if($SourceDetails.ValidateSet.PSTypeNames -contains 'System.Array') {
                                    $ParameterDetails['ValidateSet'] = "'$($SourceDetails.ValidateSet -join "', '")'"
                                }
                                else {
                                    $ParameterDetails['ValidateSet'] = $SourceDetails.ValidateSet
                                }
                            }

                            if((-not $ParameterDetails.Description) -and 
                               $SourceDetails.ContainsKey('Description') -and $SourceDetails.Description)
                            {
                                $ParameterDetails['Description'] = $SourceDetails.Description
                            }

                            $ParamsToBeReplaced[$ParameterDetails.Name] = $ParameterDetails 
                        }
                    }

                    $ParamsToBeReplaced.GetEnumerator() | ForEach-Object {
                        $FunctionDetails.ParametersTable[$_.Key] = $_.Value
                    }
                }
                elseif (($FunctionDetails.Type -eq "$Namespace.$Models.$($DefFunctionDetails.Name)") -and 
                        $SourceDetails.ContainsKey('Type'))
                {
                    $FunctionDetails.Type = $SourceDetails.Type
                }
            }
        }
    }
}
