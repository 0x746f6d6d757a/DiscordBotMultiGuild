export function camelCaseToTitle(str) {
    return str.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());
}