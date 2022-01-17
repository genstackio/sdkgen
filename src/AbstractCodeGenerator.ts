import ICodeGenerator from './ICodeGenerator';
import {code_generator_options, sdk_definition, sdk_definition_file, sdk_definition_files} from "./types";
import {mkdirSync, writeFileSync, readFileSync} from 'fs';
import {dirname} from 'path';
import ejs from 'ejs';

export abstract class AbstractCodeGenerator implements ICodeGenerator {
    protected options: code_generator_options;
    protected constructor(options: code_generator_options) {
        this.options = options;
    }
    getOptions(): code_generator_options {
        return this.options;
    }
    protected async prepare(): Promise<void> {
    }
    protected async build(): Promise<sdk_definition> {
        const def: sdk_definition = await this.createEmptySdkDefinition();
        await this.configureSdkDefinition(def);
        def.files = await this.buildFiles();
        return def;
    }
    protected async createEmptySdkDefinition(): Promise<sdk_definition> {
        return {};
    }
    protected async configureSdkDefinition(definition: sdk_definition): Promise<void> {
    }
    protected async buildFiles(): Promise<sdk_definition_files> {
        const files: sdk_definition_files = {};
        (Object.assign as Function)(files, await this.buildStaticFiles());
        (Object.assign as Function)(files, await this.buildDynamicFiles());

        return files;
    }
    protected async buildStaticFiles(): Promise<sdk_definition_files> {
        return Object.entries(await this.buildStaticFilesFromStaticTemplates()).reduce((acc, [k, v]) => {
            // noinspection SuspiciousTypeOfGuard
            acc[k] = true === v ? ({read}) => read(k) : (('string' === typeof v) ? ({read}) => read(v) : undefined);
            return acc;
        }, {});
    }
    protected async buildStaticFilesFromStaticTemplates(): Promise<{[key: string]: string|true}> {
        return {};
    }
    protected async buildDynamicFiles(): Promise<sdk_definition_files> {
        return {};
    }
    async generate(): Promise<void> {
        const def = await this.generateDefinition();
        return this.generateFilesFromDefinition(def, this.getOptions());
    }
    async generateDefinition(): Promise<sdk_definition> {
        await this.prepare();
        return this.build();
    }
    async generateFilesFromDefinition(definition: sdk_definition, options: code_generator_options): Promise<void> {
        const templateDir = `${__dirname}/../resources/templates/${definition.templatePath || ''}`;
        await Promise.all((Object.entries(definition.files || {}) as [string, sdk_definition_file][]).map(async ([k, v]) => {
            const fileFullPath = `${options.target}/${k}`;
            const parentDirFullPath = dirname(fileFullPath);
            mkdirSync(parentDirFullPath, {recursive: true});
            const read = (name: string) => readFileSync(`${templateDir}/${name}`, 'utf-8');
            const render = (data: any = {}) => ejs.render(read(`${k}.ejs`), data, {});
            let content: string = '';
            if ('function' === typeof v) {
                try {
                    content = v({render, read})
                } catch (e) {
                    console.error(k, e);
                }
            } else { // noinspection SuspiciousTypeOfGuard
                if ('string' === typeof v) {
                                content = v;
                            }
            }
            if (content) {
                writeFileSync(fileFullPath, content);
            }
        }))
    }
}

export default AbstractCodeGenerator;