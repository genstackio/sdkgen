export type code_generator_options = {
    template: string;
    source: string;
    target: string;
    language: string;
    configFile?: string;
    [key: string]: any;
}

export type sdk_definition = {
    files?: sdk_definition_files;
    templatePath?: string;
}

export type sdk_definition_files = {
    [key: string]: sdk_definition_file;
}

export type sdk_definition_file = sdk_definition_file_from_function | sdk_definition_file_from_string;

export type sdk_definition_file_from_function = ({render, read}: {render: Function, read: Function}) => string;
export type sdk_definition_file_from_string = string;

export type sdk_service_definition = {
    methods?: sdk_service_definition_methods;
    requiredModels?: sdk_service_definition_required_models;
    queries?: sdk_service_definition_queries;
    types?: sdk_service_definition_types;
    models?: sdk_service_definition_models;
    inputs?: sdk_service_definition_inputs;
    ignoredModels?: sdk_service_definition_ignored_models;
}
export type sdk_service_definition_ignored_models = {
    [key: string]: true;
}
export type sdk_service_definition_types = {
    [key: string]: sdk_service_definition_type;
}
export type sdk_service_definition_type = {
    name: string;
    required?: boolean;
    fields?: sdk_service_definition_type_fields;
}
export type sdk_service_definition_type_fields = {
    [key: string]: sdk_service_definition_type_field;
}
export type  sdk_service_definition_type_field = {
    name: string;
}
export type sdk_service_definition_models = {
    [key: string]: sdk_service_definition_model;
}
export type sdk_service_definition_model = {
    name: string;
}
export type sdk_service_definition_inputs = {
    [key: string]: sdk_service_definition_input;
}
export type sdk_service_definition_input = {
    name: string;
}
export type sdk_service_definition_queries = {
    [key: string]: sdk_service_definition_query;
}
export type sdk_service_definition_query = {
    name: string;
    type: 'mutation' | 'query';
    args?: sdk_service_definition_query_args;
    fields?: sdk_service_definition_query_fields;
}
export type sdk_service_definition_query_args = {
    [key: string]: sdk_service_definition_query_arg;
}

export type sdk_service_definition_query_arg = sdk_service_type & {
    name: string;
}
export type sdk_service_definition_query_fields = {
    [key: string]: sdk_service_definition_query_field;
}
export type sdk_service_definition_query_field = {
    name: string;
}
export type sdk_service_definition_required_models = {
    [key: string]: sdk_service_definition_required_model;
}
export type sdk_service_definition_required_model = {
    name: string;
}
export type sdk_service_definition_methods = {
    [key: string]: sdk_service_definition_method;
}
export type sdk_service_definition_method = {
    name: string;
    args?: sdk_service_definition_method_args;
    returnType: sdk_service_definition_method_return_type;
    async?: boolean;
    type?: string;
}

export type sdk_service_type = {
    type?: string;
    list?: boolean;
    required?: boolean;
    primitive?: boolean;
    values?: any[];
    gqlType: string;
}

export type sdk_service_definition_method_args = {
    [key: string]: sdk_service_definition_method_arg;
}

export type sdk_service_definition_method_arg = sdk_service_type & {
    name: string;
}

export type sdk_service_definition_method_return_type = sdk_service_type & {
}