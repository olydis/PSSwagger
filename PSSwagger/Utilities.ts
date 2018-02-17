
function removeSpecialCharacter(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '');
}

function getPascalCasedString(name: string): string {
  if (name) {
    name = removeSpecialCharacter(name);
    return name.charAt(0).toUpperCase() + name.substr(1);
  }
  return undefined;
}

// generates a cmdlet for the definition
function newSwaggerSpecDefinitionCommand(functionDetails: any, generatedCommandsPath: string, modelsNamespace: string, psHeaderComment: string) {
  const commandName = `New-${functionDetails.Name}Object`
  const commandHelp = helpDescStr(functionDetails.synopsis, functionDetails.description);

  let paramHelp = "";
  let paramblock = "";
  let body = "";
  let DefinitionTypeNamePrefix = modelsNamespace + ".";
  let ParameterSetPropertyString = "";
  let ValueFromPipelineString = '';
  let ValueFromPipelineByPropertyNameString = '';
  let parameterDefaultValueOption = "";

  for (const ParameterDetails of Object.values(functionDetails.ParametersTable)) {
    if (!ParameterDetails.Discriminator) {
      const parameterName = ParameterDetails.Name;
      const paramType = `[${ParameterDetails.Type}]\r\n        `;
      const AllParameterSetsString = parameterAttributeString(ParameterDetails.Mandatory, ValueFromPipelineByPropertyNameString, ValueFromPipelineString, ParameterSetPropertyString);
      let ValidateSetDefinition = null;
      if (ParameterDetails.ValidateSet) {
        ValidateSetDefinition = validateSetDefinitionString(ParameterDetails.ValidateSet);
      }
      let ParameterAliasAttribute = null
      paramblock += parameterDefString(AllParameterSetsString, null, ValidateSetDefinition, paramType, "$" + parameterName, parameterDefaultValueOption);

      paramHelp += helpParamStr(parameterName, ParameterDetails.Description);
    }

  }
  paramblock = paramblock.replace(/[\s,]*$/, "");


  const commandString = advFnSignatureForDefintion(commandHelp, paramHelp, commandName, paramblock, createObjectStr(DefinitionTypeNamePrefix + functionDetails.Name));

  const commandFilePath = `${generatedCommandsPath}/${commandName}.ps1`;
  CreateDirectoryFor(commandFilePath);
  writeFileSync(commandFilePath, getFormattedFunctionContent(psHeaderComment + commandString));
  logVerbose(`Generated command '${commandName}' for the definition name '${functionDetails.Name}'.`);
  return commandName;
}


const advFnSignatureForDefintion = (commandHelp: string, paramHelp: string, commandName: string, paramblock: string, body: string) => `
<#
${commandHelp}
${paramHelp}
#>
function ${commandName}
{
    param(${paramblock}
    )
    ${body}
}
`;

const createObjectStr = (definitionTypeName: string) => `

    $Object = New-Object -TypeName ${definitionTypeName}

    $PSBoundParameters.GetEnumerator() | ForEach-Object { 
        if(Get-Member -InputObject $Object -Name $_.Key -MemberType Property)
        {
            $Object.$($_.Key) = $_.Value
        }
    }

    if(Get-Member -InputObject $Object -Name Validate -MemberType Method)
    {
        $Object.Validate()
    }

    return $Object
`;


