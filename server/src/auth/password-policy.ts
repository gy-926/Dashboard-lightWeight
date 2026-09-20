// 新密码必须由字母、数字和符号组成，且不能包含空白字符。
export const PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\p{N})(?=.*[\p{P}\p{S}])\S{8,128}$/u;
export const PASSWORD_MESSAGE = '密码需为 8–128 位，包含字母、数字和符号，且不能包含空格';
