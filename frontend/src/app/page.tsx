import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona para o dashboard; o middleware de auth protege a rota
  redirect("/dashboard");
}
