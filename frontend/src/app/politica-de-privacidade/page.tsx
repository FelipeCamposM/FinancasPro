import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  robots: { index: false },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <div className="prose prose-neutral max-w-none space-y-8 text-foreground">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Quem somos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A <strong className="text-foreground">Valora Finanças</strong> (<strong>valorafinancas.com</strong>) é uma plataforma de controle financeiro pessoal.
              Esta política descreve como coletamos, usamos e protegemos seus dados pessoais em conformidade com a{" "}
              <strong className="text-foreground">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Dados que coletamos</h2>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Dados de cadastro:</strong> nome e endereço de e-mail.</li>
              <li><strong className="text-foreground">Dados financeiros:</strong> gastos, renda, cartões e assinaturas que você registra voluntariamente.</li>
              <li><strong className="text-foreground">Dados de acesso:</strong> data e hora de login, endereço IP.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Finalidade do tratamento</h2>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>Criar e gerenciar sua conta.</li>
              <li>Exibir seu painel financeiro e relatórios.</li>
              <li>Enviar e-mails transacionais (verificação de conta, redefinição de senha).</li>
              <li>Garantir a segurança da plataforma.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Base legal (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento dos seus dados é realizado com base no seu <strong className="text-foreground">consentimento</strong> (Art. 7º, I da LGPD),
              na <strong className="text-foreground">execução do contrato</strong> de uso da plataforma (Art. 7º, V) e no
              cumprimento de <strong className="text-foreground">obrigações legais</strong> quando aplicável (Art. 7º, II).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Compartilhamento de dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.
              Podemos compartilhar dados apenas com provedores de infraestrutura (hospedagem, e-mail transacional)
              estritamente necessários para o funcionamento da plataforma, mediante contratos de confidencialidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Seus direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Conforme a LGPD, você tem direito a:</p>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>Confirmar a existência e acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a exclusão dos seus dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Solicitar a portabilidade dos dados.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Para exercer seus direitos, entre em contato pelo e-mail{" "}
              <strong className="text-foreground">contato@valorafinancas.com</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Adotamos medidas técnicas e organizacionais para proteger seus dados,
              incluindo criptografia de senhas, autenticação por token e comunicação via HTTPS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Retenção de dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são mantidos enquanto sua conta estiver ativa.
              Após a exclusão da conta, os dados são removidos em até 30 dias, salvo obrigação legal de retenção.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Contato e DPO</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dúvidas sobre esta política ou sobre o tratamento dos seus dados:{" "}
              <strong className="text-foreground">contato@valorafinancas.com</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
