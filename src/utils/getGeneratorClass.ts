import camelCase from "./camelCase";

export function getGeneratorClass(type: string, language: string) {
    return require(`${__dirname}/../generators/${type}/${camelCase(language)}${camelCase(type)}SdkSourceCodeGenerator`).default;
}

export default getGeneratorClass;