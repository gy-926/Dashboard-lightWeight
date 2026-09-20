export const NEW_PASSWORD_HINT = '密码需为 8–128 位，包含字母、数字和符号，且不能包含空格';
const NEW_PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\p{N})(?=.*[\p{P}\p{S}])\S{8,128}$/u;

export function validateNewPassword(password: string): string | null {
  return NEW_PASSWORD_PATTERN.test(password) ? null : NEW_PASSWORD_HINT;
}
