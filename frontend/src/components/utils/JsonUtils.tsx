// XSS 필터링을 적용하는 함수
function xssSanitize(str: string) {
    return String(str).replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}

// JSON.stringify를 확장하는 함수
function stringifyWithXSSFilter(obj: any) {
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'string') {
            return xssSanitize(value);
        }
        return value;
    });
}

// JSON 객체에 확장된 stringify 함수 추가
const JSONXSS = {
    stringify: stringifyWithXSSFilter,
};

export default JSONXSS;
