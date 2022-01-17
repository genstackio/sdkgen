import {code_generator_options} from "./types";

export interface ICodeGenerator {
    generate(): Promise<void>;
    getOptions(): code_generator_options;
}

export default ICodeGenerator;