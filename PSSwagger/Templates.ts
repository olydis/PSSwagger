
const outputTypeStr = (fullPathDataType: string): string => `
        [OutputType([${fullPathDataType}])]
`;

const parameterAttributeString = (isParamMandatory: boolean, valueFromPipelineByPropertyNameString: string, valueFromPipelineString: string, parameterSetPropertyString: string): string =>
  `[Parameter(Mandatory = ${isParamMandatory}${valueFromPipelineByPropertyNameString}${valueFromPipelineString}${parameterSetPropertyString})]`;

const parameterAliasAttributeString = (aliasString: string) => `
        [Alias(${aliasString})]
`;

const validateSetDefinitionString = (validateSetString: string) => `
        [ValidateSet(${validateSetString})]
`;

const parameterGroupCreateExpression = (groupName: string, fullGroupName: string) => `
$${groupName} = New-Object -TypeName ${fullGroupName}
`;

const parameterGroupPropertyExpression = (groupName: string, parameterGroupPropertyName: string) => `
    if ($PSBoundParameters.ContainsKey('${parameterGroupPropertyName}')) { $${groupName}.${parameterGroupPropertyName} = $${parameterGroupPropertyName} }
`;

const parameterDefString = (allParameterSetsString: string, parameterAliasAttribute: string, validateSetDefinition: string, paramType: string, paramName: string, parameterDefaultValueOption: string) => `
        ${allParameterSetsString || ""}${parameterAliasAttribute || ""}${validateSetDefinition || ""}
        ${paramType}${paramName}${parameterDefaultValueOption || ""},
`;

const helpParamStr = (parameterName: string, pDescription: string) => `
.PARAMETER ${parameterName}
    ${pDescription}
`;

const parameterDefaultValueString = (parameterDefaultValue: string) => ` = ${parameterDefaultValue}`;