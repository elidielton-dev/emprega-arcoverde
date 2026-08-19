import { NextResponse } from "next/server";

/** POST de formulário HTML precisa de 303 para o browser seguir com GET. */
export function formRedirect(url: URL | string) {
  return NextResponse.redirect(url, 303);
}
