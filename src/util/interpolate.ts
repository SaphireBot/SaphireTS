const leftDelimiter = "{";
const rightDelimiter = "}";
const regex = RegExp(`${leftDelimiter}([^${rightDelimiter}]+)${rightDelimiter}`, "g");
const separator = ".";

export function interpolate(content: string, data: Record<any, any>): string
export function interpolate(content: string, data: any) {
  return content.replace(regex, function (placeholder, param: string) {
    let value = data;

    const parts = param.split(separator);

    for (let i = 0; i < parts.length; i++) {
      if (value === undefined) {
        value = placeholder;
        break;
      }
      value = value[parts[i]!];
    }

    return value;
  });
}