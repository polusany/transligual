export default function Login() {
  return <section><p className="eyebrow">ACCOUNT</p><h1>Welcome to Transligual</h1><form><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" minLength={12} required /></label><button type="submit">Continue</button></form><p className="hint">Developer 2: connect this form to <code>POST /api/v1/auth/register</code> after Day 2.</p></section>;
}
