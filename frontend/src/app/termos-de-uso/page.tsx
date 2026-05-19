import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  robots: { index: false },
};

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <div className="space-y-8 text-foreground">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Aceitação</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao criar uma conta na <strong className="text-foreground">Valora Finanças</strong>, você declara ter lido,
              compreendido e concordado com estes Termos de Uso. Se não concordar, não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Descrição do serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              A Valora Finanças é uma plataforma web de controle financeiro pessoal que permite registrar gastos,
              renda, cartões de crédito e assinaturas, gerando relatórios e dashboards de finanças pessoais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Cadastro e conta</h2>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>Você deve ter pelo menos 18 anos ou ter consentimento dos responsáveis legais.</li>
              <li>As informações fornecidas no cadastro devem ser verdadeiras e atualizadas.</li>
              <li>Você é responsável pela segurança e confidencialidade da sua senha.</li>
              <li>É proibido compartilhar sua conta com terceiros.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Uso permitido</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma é de uso estritamente pessoal. É proibido:
            </p>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>Utilizar a plataforma para fins ilegais ou fraudulentos.</li>
              <li>Tentar acessar dados de outros usuários.</li>
              <li>Realizar engenharia reversa, copiar ou redistribuir o software.</li>
              <li>Sobrecarregar intencionalmente os servidores da plataforma.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Dados financeiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados financeiros registrados na plataforma são de sua responsabilidade.
              A Valora Finanças não se conecta a bancos nem acessa contas bancárias —
              todos os dados são inseridos manualmente por você.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Disponibilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos esforçamos para manter a plataforma disponível, mas não garantimos disponibilidade
              ininterrupta. Podemos realizar manutenções com ou sem aviso prévio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Limitação de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A Valora Finanças não se responsabiliza por decisões financeiras tomadas com base nos dados
              registrados na plataforma. As informações exibidas dependem inteiramente dos dados inseridos pelo usuário.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Encerramento de conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você pode solicitar o encerramento da sua conta a qualquer momento via{" "}
              <strong className="text-foreground">contato@valorafinancas.com</strong>.
              Reservamo-nos o direito de encerrar contas que violem estes Termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Alterações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas
              por e-mail ou notificação na plataforma. O uso continuado após a notificação constitui aceite dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Lei aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil.
              Fica eleito o foro da comarca de domicílio do usuário para dirimir eventuais controvérsias.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">contato@valorafinancas.com</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
