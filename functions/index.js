const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const axios = require("axios");
const path = require("path");
const env = require("./env.json");
const cors = require("cors")({origin: true});
const mercadopago = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

// Configuração do Mercado Pago Webhook Teste
const WEBHOOK_SECRET = env.mercadopago.webhookSecret;

// Configurar o Nodemailer para enviar e-mails diretamente pelo Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.email.user,
    pass: env.email.password,
  },
});

/**
 * Gera um código aleatório de 6 dígitos para verificação.
 * @return {string} Código numérico de 6 dígitos como string.
 */
function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🚀 Função para enviar o código por e-mail
exports.enviarCodigoEmail = functions.https.onRequest((req, res) => {
  // Aplica CORS middleware antes de processar a requisição
  return cors(req, res, async () => {
    try {
      // Verifica se é uma requisição OPTIONS (preflight)
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      // Verifica se é uma requisição POST
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          message: "Método não permitido",
        });
      }

      const {email} = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "E-mail obrigatório",
        });
      }

      const codigo = gerarCodigo();
      // Salvar código temporariamente
      await db.collection("codigos").doc(email).set({
        codigo,
        expiracao: admin.firestore.Timestamp.now().seconds + 300,
      });

      // Enviar e-mail com o código
      const mailOptions = {
        from: `"Papa Tango" <${env.email.user}>`,
        to: email,
        subject: "Seu código de verificação",
        text: `Seu código de verificação é: ${codigo}. Ele expira em 5 minutos.`,
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        success: true,
        message: "Código enviado!",
      });
    } catch (error) {
      console.error("Erro ao enviar código:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor.",
      });
    }
  });
});

// 🚀 Função para verificar código inserido pelo usuário
exports.verificarCodigo = functions.https.onRequest((req, res) => {
  // Aplica CORS middleware
  return cors(req, res, async () => {
    try {
      // Verifica se é uma requisição OPTIONS (preflight)
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      // Verifica se é uma requisição POST
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          message: "Método não permitido",
        });
      }

      const {email, codigo} = req.body;
      if (!email || !codigo) {
        return res.status(400).json({
          success: false,
          message: "E-mail e código obrigatórios",
        });
      }

      const doc = await db.collection("codigos").doc(email).get();
      if (!doc.exists) {
        return res.status(400).json({
          success: false,
          message: "Código não encontrado ou expirado.",
        });
      }

      const data = doc.data();
      const agora = admin.firestore.Timestamp.now().seconds;
      if (agora > data.expiracao) {
        await db.collection("codigos").doc(email).delete();
        return res.status(400).json({
          success: false,
          message: "Código expirado.",
        });
      }

      if (data.codigo !== codigo) {
        return res.status(400).json({
          success: false,
          message: "Código incorreto.",
        });
      }

      // Código válido → remove do Firestore
      await db.collection("codigos").doc(email).delete();

      return res.json({
        success: true,
        message: "Código validado!",
      });
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor.",
      });
    }
  });
});

// 🚀 Função para enviar email de conclusão de cadastro para o usuário e empresa
exports.enviarEmailConclusao = functions.https.onRequest((req, res) => {
  // Aplica CORS middleware
  return cors(req, res, async () => {
    try {
      // Verifica se é uma requisição OPTIONS (preflight)
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      // Verifica se é uma requisição POST
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          message: "Método não permitido",
        });
      }

      const {email, nome} = req.body;
      if (!email || !nome) {
        return res.status(400).json({
          success: false,
          message: "Email e nome são obrigatórios",
        });
      }

      const mailOptions = {
        from: `"Papa Tango" <${env.email.user}>`,
        to: email,
        subject: "Cadastro Recebido - Em Análise",
        html: `
            <div style="text-align: center;">
                <img src="cid:Logo" alt="Logo Papa Tango"
                     style="width: 70px; margin-bottom: 20px;">
            </div>
            <h2>Olá ${nome}!</h2>
            <p>Seu cadastro foi recebido com sucesso! 🎉🏍️🥳</p>
            <p>Estamos analisando seus documentos, este processo pode levar até 4 horas úteis.</p>
            <p>Você receberá um novo email e falaremos com você através do WhatsApp
               assim que a análise for concluída.</p>
            <p>Caso queira, clique em falar com suporte para falar com nossa equipe</p>
            <br>
            <br>
            <div style="text-align: center;">
                <a href="https://wa.me/5585992684035?text=Quero%20falar%20com%20o%20
                suporte%2C%20já%20recebi%20o%20email%20de%20recebimento%20de%20dados"
                   style="background-color: #CB2921;
                          color: white;
                          padding: 10px 20px;
                          text-decoration: none;
                          border-radius: 5px;
                          font-weight: bold;">
                    Falar com Suporte
                </a>
            </div>
            <br>
            <br>
            <p>Atenciosamente,</p>
            <p>Equipe Papa Tango - Aluguel de Motos</p>
            `,
        attachments: [{
          filename: "Logo.png",
          path: path.join(__dirname, "src/assets/Logo.png"),
          cid: "Logo",
        }],
      };

      await transporter.sendMail(mailOptions);

      // Email para a empresa
      const mailOptionsEmpresa = {
        from: `"Sistema Papa Tango" <${env.email.user}>`,
        to: env.email.user,
        subject: "Novo Cadastro Finalizado no App Papa Tango",
        html: `
                <div style="text-align: center;">
                    <img src="cid:Logo" alt="Logo Papa Tango"
                         style="width: 70px; margin-bottom: 20px;">
                </div>
                <h2>Novo cadastro finalizado! 🎉</h2>
                <p>O usuário <strong>${nome}</strong> completou todas as etapas do cadastro.</p>
                <p>Email do usuário: ${email}</p>
                <p>Os documentos estão prontos para análise.</p>
                <br>
                <p>Atenciosamente,</p>
                <p>Sistema Papa Tango</p>
            `,
        attachments: [{
          filename: "Logo.png",
          path: path.join(__dirname, "src/assets/Logo.png"),
          cid: "Logo",
        }],
      };

      await transporter.sendMail(mailOptionsEmpresa);

      return res.json({
        success: true,
        message: "Email de confirmação enviado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao enviar email de conclusão:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor.",
      });
    }
  });
});

// 🚀 Função para enviar email de reset de senha para o usuário
exports.enviarEmailResetSenha = functions.https.onRequest((req, res) => {
  // Aplica CORS middleware
  return cors(req, res, async () => {
    try {
      // Verifica se é uma requisição OPTIONS (preflight)
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      // Verifica se é uma requisição POST
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          message: "Método não permitido",
        });
      }

      const {email} = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email é obrigatório",
        });
      }

      // Verifica se o usuário existe no Firebase
      try {
        await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          return res.status(404).json({
            success: false,
            message: "Email não cadastrado no sistema",
          });
        }
        throw error;
      }

      const resetLink = await admin.auth().generatePasswordResetLink(email);

      const mailOptions = {
        from: `"Papa Tango" <${env.email.user}>`,
        to: email,
        subject: "Recuperação de Senha - Papa Tango",
        html: `
                <div style="text-align: center;">
                    <img src="cid:Logo" alt="Logo Papa Tango"
                         style="width: 70px; margin-bottom: 20px;">
                </div>
                <h2>Olá!</h2>
                <p>Você solicitou a recuperação de senha do app Papa Tango Aluguel de Motos. 🔐</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetLink}"
                       style="background-color: #CB2921;
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 5px;
                              font-weight: bold;">
                        Redefinir Senha
                    </a>
                </div>
                <p>Se você não solicitou esta alteração, ignore este email.</p>
                <p>Atenciosamente,</p>
                <p>Equipe Papa Tango Aluguel de Motos</p>
            `,
        attachments: [{
          filename: "Logo.png",
          path: path.join(__dirname, "src/assets/Logo.png"),
          cid: "Logo",
        }],
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        success: true,
        message: "Email de recuperação enviado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao enviar email de recuperação:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor.",
      });
    }
  });
});

// 🚀 Função para enviar email de notificação de troca de óleo
// Esta é uma função callable, não HTTP, então não precisa de CORS
exports.enviarEmailTrocaOleo = functions.https.onCall(async (data) => {
  try {
    const mailOptions = {
      from: `"Sistema Papa Tango" <${env.email.user}>`,
      to: env.email.user,
      subject: "Nova Troca de Óleo Registrada",
      html: `
                <div style="text-align: center;">
                    <img src="cid:Logo" alt="Logo Papa Tango"
                         style="width: 70px; margin-bottom: 20px;">
                </div>
                <h2>Nova troca de óleo registrada! 🏍️</h2>
                <p>Usuário: <strong>${data.data.userName}</strong></p>
                <p>Email: ${data.data.userEmail}</p>
                <p>Telefone: ${data.data.userPhone}</p>
                <p>Data: ${data.data.dataUpload}</p>
                <h3>Arquivos:</h3>
                <p><strong>Foto do Óleo:</strong>
                   <a href="${data.data.fotoOleo}">Visualizar</a></p>
                <p><strong>Nota Fiscal:</strong>
                   <a href="${data.data.fotoNota}">Visualizar</a></p>
                <p><strong>Quilometragem:</strong>
                   <a href="${data.data.fotoKm}">Visualizar</a></p>
                <p><strong>Vídeo da Troca:</strong>
                   <a href="${data.data.videoOleo}">Visualizar</a></p>
                <br>
                <p>Atenciosamente,</p>
                <p>Sistema Papa Tango</p>
            `,
      attachments: [{
        filename: "Logo.png",
        path: path.join(__dirname, "src/assets/Logo.png"),
        cid: "Logo",
      }],
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Email enviado com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao enviar email de troca de óleo:", error);
    throw new functions.https.HttpsError("internal", "Erro ao enviar email.");
  }
});


// Função para processar pagamento
exports.processPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Verificar se o método é POST
      if (req.method !== "POST") {
        return res.status(405).json({error: "Método não permitido"});
      }

      console.log("Dados recebidos:", req.body);

      // Inicializar o SDK com seu token de acesso
      const mp = new mercadopago.MercadoPagoConfig({
        accessToken: env.mercadopago.accessToken,
      });

      const paymentClient = new mercadopago.Payment(mp);

      // Mapear os parâmetros recebidos para os nomes esperados pelo Mercado Pago
      const {paymentType, transactionAmount, description, payer} = req.body;

      // Criar o objeto de pagamento com os nomes corretos de parâmetros
      const paymentData = {
        transaction_amount: transactionAmount,
        description: description,
        payment_method_id: paymentType === "pix" ? "pix" : "bolbradesco", // Mapear paymentType para payment_method_id
        payer: payer,
      };

      // Se for PIX, adicionar os parâmetros específicos
      if (paymentType === "pix") {
        paymentData.payment_method_id = "pix";

      // Se for boleto, adicionar os parâmetros específicos
      } else if (paymentType === "boleto") {
        paymentData.payment_method_id = "bolbradesco";
      }

      console.log("Dados formatados para o Mercado Pago:", paymentData);

      // Criar o pagamento usando o SDK do Mercado Pago
      const payment = await paymentClient.create({body: paymentData});

      res.json({
        status: payment.status,
        status_detail: payment.status_detail,
        id: payment.id,
        transaction_details: payment.transaction_details,
        payment_method: payment.payment_method,
        point_of_interaction: payment.point_of_interaction,
      });
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      res.status(500).json({
        error: "Erro ao processar pagamento",
        details: error.message,
      });
    }
  });
});

/**
 * Envia uma notificação de pagamento para um usuário específico
 * @param {string} userId - ID do usuário que receberá a notificação
 * @param {Object} notification - Objeto contendo os dados da notificação
 * @param {string} notification.title - Título da notificação
 * @param {string} notification.body - Corpo da notificação
 * @param {Object} [notification.data] - Dados adicionais da notificação (opcional)
 * @return {Promise<void>} Uma promessa que resolve quando a notificação é enviada
 */
async function sendPaymentNotification(userId, notification) {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.warn(`Usuário ${userId} não encontrado para enviar notificação`);
      return;
    }

    const user = userDoc.data();
    const fcmToken = user.fcmToken;

    if (!fcmToken) {
      console.warn(`Usuário ${userId} não tem token para notificações`);
      return;
    }

    let success = false;

    // Verificar se é um token Expo
    if (fcmToken.startsWith("ExponentPushToken[")) {
      // Enviar via API do Expo
      const expoMessage = {
        to: fcmToken,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: "default",
        priority: "high",
        channelId: "default",
      };

      console.log(`Enviando notificação via Expo para usuário ${userId}:`, expoMessage);

      try {
        // Usar axios em vez de fetch
        const axiosResponse = await axios.post("https://exp.host/--/api/v2/push/send", expoMessage, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        });

        // Com axios, a resposta já é um objeto JSON
        const response = axiosResponse.data;
        console.log(`Resposta da API Expo para usuário ${userId}:`, response);

        if (response.data && Array.isArray(response.data) && response.data[0].status === "ok") {
          success = true;
          console.log(`Notificação Expo enviada com sucesso para usuário ${userId}`);
        } else {
          console.error(`Erro ao enviar notificação Expo para usuário ${userId}:`, response);
        }
      } catch (axiosError) {
        console.error(`Erro na requisição para API do Expo (usuário ${userId}):`, axiosError);

        // Capturar detalhes da resposta de erro, se disponíveis
        if (axiosError.response) {
          console.error("Detalhes da resposta de erro:", {
            status: axiosError.response.status,
            data: axiosError.response.data,
          });
        }
      }
    } else {
      // Enviar via FCM diretamente
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
      });

      success = true;
      console.log(`Notificação FCM enviada para o usuário ${userId}`);
    }

    // Salvar a notificação no Firestore apenas se foi enviada com sucesso
    if (success) {
      await db.collection("notifications").add({
        userId,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error(`Erro ao enviar notificação para o usuário ${userId}:`, error);
  }
}

// Função para enviar notificações para usuários pelo Email
exports.processEmailRequests = functions.firestore
    .onDocumentCreated("emailRequests/{requestId}", async (event) => {
      const snapshot = event.data;
      if (!snapshot) {
        console.log("Nenhum dado disponível");
        return null;
      }

      const emailData = snapshot.data();
      const requestId = event.params.requestId;

      try {
        console.log(`Processando solicitação de email: ${requestId}`);

        // Verificar se todos os campos necessários estão presentes
        if (!emailData.to || !emailData.subject || !emailData.html) {
          throw new Error("Dados de email incompletos");
        }

        // Configurar o email
        const mailOptions = {
          from: `"Papa Tango" <${env.email.user}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        };

        // Enviar o email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email enviado: ${info.messageId}`);

        // Atualizar o status do documento
        await snapshot.ref.update({
          status: "sent",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          messageId: info.messageId,
        });

        return null;
      } catch (error) {
        console.error(`Erro ao enviar email: ${error.message}`);

        // Atualizar o status do documento com o erro
        await snapshot.ref.update({
          status: "error",
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return null;
      }
    });


// Função para processar solicitações de notificação usando Expo Push e Firestore
exports.processarNotificacoes = functions.firestore
    .onDocumentCreated("notificationRequests/{requestId}", async (event) => {
      try {
        const snapshot = event.data;
        if (!snapshot) {
          console.log("Nenhum dado disponível");
          return null;
        }

        const data = snapshot.data();
        const requestId = event.params.requestId;
        console.log("Processando solicitação de notificação:", requestId, "com dados:", JSON.stringify(data));

        if (!data || !data.userEmail || !data.title || !data.body) {
          console.error("Dados de notificação inválidos:", data);
          await snapshot.ref.update({
            status: "error",
            error: "Dados de notificação inválidos",
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return null;
        }

        // Buscar o usuário pelo email
        const usersRef = admin.firestore().collection("users");
        const userQuery = await usersRef.where("email", "==", data.userEmail).limit(1).get();

        if (userQuery.empty) {
          console.error("Usuário não encontrado:", data.userEmail);
          await snapshot.ref.update({
            status: "error",
            error: "Usuário não encontrado",
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return null;
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        // Verificar se o usuário tem um token
        if (!userData.fcmToken) {
          console.error("Token de notificação não encontrado para o usuário:", data.userEmail);
          await snapshot.ref.update({
            status: "error",
            error: "Token de notificação não encontrado",
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return null;
        }

        console.log("Token de notificação encontrado:", userData.fcmToken);

        let response;
        let success = false;

        // Verificar se é um token Expo (começa com ExponentPushToken)
        if (userData.fcmToken.startsWith("ExponentPushToken[")) {
          // Enviar via API do Expo
          const expoMessage = {
            to: userData.fcmToken,
            title: data.title,
            body: data.body,
            data: data.data || {},
            sound: "default",
            priority: "high",
            channelId: "default", // Adicionar channelId para Android
          };

          console.log("Enviando mensagem via Expo:", JSON.stringify(expoMessage));

          try {
            // Usando axios para fazer a requisição
            const axiosResponse = await axios.post("https://exp.host/--/api/v2/push/send", expoMessage, {
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
              },
            });

            // Com axios, a resposta já é um objeto JSON
            response = axiosResponse.data;
            console.log("Notificação enviada via Expo (resposta):", response);

            // A API Expo pode retornar diferentes formatos de resposta
            // Aceitar qualquer resposta que indique sucesso
            success = true;
            console.log("Notificação Expo enviada com sucesso para:", userData.fcmToken);
          } catch (axiosError) {
            console.error("Erro na requisição para API do Expo:", axiosError);

            // Capturar detalhes da resposta de erro, se disponíveis
            if (axiosError.response) {
              console.error("Detalhes da resposta de erro:", {
                status: axiosError.response.status,
                data: axiosError.response.data,
              });
            }

            throw axiosError;
          }
        } else {
        // Enviar via FCM diretamente
          const fcmMessage = {
            token: userData.fcmToken,
            notification: {
              title: data.title,
              body: data.body,
            },
            data: data.data || {},
          };

          response = await admin.messaging().send(fcmMessage);
          console.log("Notificação enviada via FCM:", response);
          success = true;
        }

        // Atualizar o status da solicitação
        await snapshot.ref.update({
          status: success ? "sent" : "error",
          response: response,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Registrar a notificação enviada apenas se foi bem-sucedida
        if (success) {
          await admin.firestore().collection("notifications").add({
            userId: userDoc.id,
            email: data.userEmail,
            title: data.title,
            body: data.body,
            data: data.data || {},
            sent: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`Notificação enviada com sucesso para ${data.userEmail}`);
        }

        return {success: success};
      } catch (error) {
        console.error("Erro ao processar solicitação de notificação:", error);

        try {
        // Atualizar o status da solicitação com o erro
          await event.data.ref.update({
            status: "error",
            error: error.message,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (updateError) {
          console.error("Erro ao atualizar status de erro:", updateError);
        }

        return {success: false, error: error.message};
      }
    });

/**
 * Função para lidar com webhooks do Mercado Pago
 */
exports.webhook = functions.https.onRequest((req, res) => {
  // Garantir que o corpo da requisição esteja disponível como string
  const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

  cors(req, res, async () => {
    try {
      // Verificar se o método é POST
      if (req.method !== "POST") {
        console.log("Método não permitido:", req.method);
        return res.status(200).send("OK");
      }

      console.log("Webhook recebido - Headers:", JSON.stringify(req.headers));
      console.log("Webhook recebido - Body:", rawBody);

      // Verificar a assinatura do webhook
      const signature = req.headers["x-signature"] ||
                        req.headers["x-hub-signature"] ||
                        req.headers["x-webhook-signature"];

      let isValidSignature = false;

      if (signature) {
        // Verificar a assinatura usando o segredo fornecido pelo Mercado Pago
        const crypto = require("crypto");

        // Gerar a assinatura esperada
        const expectedSignature = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(rawBody)
            .digest("hex");

        // Extrair a assinatura recebida (pode vir com ou sem o prefixo sha256=)
        let receivedSignature = signature;

        // Se a assinatura contém ts= e v1=, é o novo formato do Mercado Pago
        if (signature.includes("ts=") && signature.includes("v1=")) {
          const v1Match = signature.match(/v1=([a-f0-9]+)/);
          if (v1Match && v1Match[1]) {
            receivedSignature = v1Match[1];
          }
        } else if (signature.startsWith("sha256=")) {
          receivedSignature = signature.substring(7);
        }

        // Comparar a assinatura recebida com a esperada
        isValidSignature = receivedSignature === expectedSignature;

        if (!isValidSignature) {
          console.warn("Assinatura de webhook inválida");
          console.log("Assinatura recebida:", signature);
          console.log("Assinatura esperada:", `sha256=${expectedSignature}`);
        } else {
          console.log("Assinatura de webhook válida");
        }
      } else {
        console.warn("Webhook recebido sem assinatura");
      }

      // Garantir que o corpo da requisição seja um objeto
      let webhookData;
      try {
        webhookData = typeof req.body === "object" ? req.body : JSON.parse(rawBody);
      } catch (e) {
        console.error("Erro ao analisar o corpo da requisição:", e);
        return res.status(200).send("OK"); // Responder com 200 mesmo para requisições inválidas
      }

      console.log("Webhook data processado:", webhookData);
      const {type, data, action} = webhookData;

      // Processar apenas notificações de pagamento
      if (type === "payment" || action === "payment.updated") {
        const paymentId = data.id;

        // Verificar se é um teste do webhook
        const isWebhookTest = paymentId === "123456" || webhookData.id === "123456" || webhookData.live_mode === false;
        if (isWebhookTest) {
          console.log("Teste de webhook detectado. Respondendo com sucesso sem processar o pagamento.");
          return res.status(200).send("OK");
        }

        // Inicializar o SDK
        const mp = new mercadopago.MercadoPagoConfig({
          accessToken: env.mercadopago.accessToken,
        });

        const paymentClient = new mercadopago.Payment(mp);

        try {
          // Obter informações do pagamento
          const paymentResponse = await paymentClient.get({id: paymentId});
          const payment = paymentResponse.response;
          console.log(`Pagamento ${paymentId} atualizado:`, payment);

          // Extrair informações importantes do pagamento
          const {
            status,
            status_detail: statusDetail,
            transaction_amount: transactionAmount,
            date_approved: dateApproved,
            date_created: dateCreated,
            external_reference: externalReference,
          } = payment;

          // Atualizar o status do pagamento no Firestore
          const db = admin.firestore();

          // Criar ou atualizar o registro de pagamento
          await db.collection("payments").doc(paymentId).set({
            paymentId,
            status,
            statusDetail,
            amount: transactionAmount,
            dateCreated: new Date(dateCreated),
            dateApproved: dateApproved ? new Date(dateApproved) : null,
            externalReference,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});

          // Buscar o usuário associado a este pagamento
          let userId = null;
          const paymentDoc = await db.collection("payments").doc(paymentId).get();

          if (paymentDoc.exists) {
            userId = paymentDoc.data().userId;
          }

          // Se não encontrou o usuário no documento de pagamento, tenta buscar pelo externalReference
          if (!userId && externalReference) {
            if (externalReference.startsWith("user_")) {
              userId = externalReference.replace("user_", "");
            }
          }

          // Enviar notificação para o usuário se o status mudou
          if (userId) {
            if (status === "approved") {
              await sendPaymentNotification(userId, {
                title: "Pagamento aprovado!",
                body: `Seu pagamento de R$ ${transactionAmount.toFixed(2)} foi aprovado.`,
                data: {
                  screen: "PaymentSuccess",
                  paymentId,
                },
              });
            } else if (status === "rejected" || status === "cancelled") {
              await sendPaymentNotification(userId, {
                title: "Atenção: Pagamento não aprovado",
                body: `Seu pagamento de R$ ${transactionAmount.toFixed(2)} não foi aprovado.`,
                data: {
                  screen: "Financeiro",
                },
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar informações do pagamento ${paymentId}:`, error);
          // Se o erro for "Payment not found", podemos responder com sucesso
          if (error.status === 404 || (error.message && error.message.includes("not found"))) {
            console.log("Pagamento não encontrado, mas respondendo com sucesso para o webhook");
            return res.status(200).send("OK");
          }
        }
      } else {
        console.log(`Tipo de evento não processado: ${type || action}`);
      }

      // Responder com sucesso
      res.status(200).send("OK");
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      // Importante: Mesmo com erro, respondemos com 200 para o Mercado Pago
      // para evitar que eles continuem tentando reenviar a notificação
      res.status(200).send("OK");
    }
  });
});

// Endpoint para verificar status do pagamento
exports.checkPaymentStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Inicializar o SDK com seu token de acesso (usando a importação tradicional com API moderna)
      const mp = new mercadopago.MercadoPagoConfig({
        accessToken: env.mercadopago.accessToken,
      });

      const paymentClient = new mercadopago.Payment(mp);

      const {paymentId} = req.query;

      if (!paymentId) {
        return res.status(400).json({
          error: "ID do pagamento não fornecido",
          details: "O parâmetro paymentId é obrigatório",
        });
      }

      // Obter o pagamento com a API moderna
      const paymentResponse = await paymentClient.get({id: paymentId});

      res.json({
        id: paymentResponse.id,
        status: paymentResponse.status,
        status_detail: paymentResponse.status_detail,
      });
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      res.status(500).json({
        error: "Erro ao verificar status do pagamento",
        details: error.message,
      });
    }
  });
});


