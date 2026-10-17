import DodoPayments from "dodopayments";

// El SDK exige un bearerToken no vacío al construirse — sin fallback, no
// tener DODO_PAYMENTS_API_KEY seteada tira abajo *todo* auth.ts (login
// incluido), no solo billing. Con el placeholder, las llamadas a Dodo
// simplemente fallan con un error de auth hasta que se configure la key real.
export const dodoClient = new DodoPayments({
	bearerToken: process.env.DODO_PAYMENTS_API_KEY || "missing_dodo_api_key",
	environment:
		process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
			? "live_mode"
			: "test_mode",
});
