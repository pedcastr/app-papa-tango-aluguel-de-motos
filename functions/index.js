const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const nodemailer = require("nodemailer");
const path = require("path");
const env = require("./env.json");
const cors = require("cors")({origin: true});
const {onSchedule} = require("firebase-functions/v2/scheduler");
const mercadopago = require("mercadopago");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

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

// Função para enviar o código por e-mail
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

// Função para verificar código inserido pelo usuário
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

// Função para enviar email de conclusão de cadastro para o usuário e empresa
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
            padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
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
            </div>
            `,
        attachments: [{
          filename: "Logo.png",
          path: path.join(__dirname, "src/assets/Logo.png"),
          cid: "Logo",
        }],
      };

      await transporter.sendMail(mailOptions);

      // Enviar Notificação Push ao Usuário Administrador
      await sendPaymentNotification(null, {
        title: "Novo Cadastro Finalizado no App Papa Tango",
        body: `Usuário: ${email}`,
        data: {screen: "Usuários", params: {screen: "UserList"}},
      }, true);

      // Email para a empresa
      const mailOptionsEmpresa = {
        from: `"Sistema Papa Tango" <${env.email.user}>`,
        to: env.email.user,
        subject: "Novo Cadastro Finalizado no App Papa Tango",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
                padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <div style="text-align: center; margin-bottom: 20px;">
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
                </div>
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

// Função para enviar email de reset de senha para o usuário
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
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
                padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <div style="text-align: center; margin-bottom: 20px;">
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
                </div>
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

// Função para enviar email de notificação de troca de óleo
// Esta é uma função callable, não HTTP, então não precisa de CORS
exports.enviarEmailTrocaOleo = functions.https.onCall(async (data) => {
  try {
    // Enviar Notificação Push ao Usuário Administrador
    await sendPaymentNotification(null, {
      title: "Nova Troca de Óleo Registrada",
      body: `Usuário: ${data.data.userEmail}`,
      data: {screen: "Usuários", params: {screen: "UserList"}},
    }, true);

    const mailOptions = {
      from: `"Sistema Papa Tango" <${env.email.user}>`,
      to: env.email.user,
      subject: "Nova Troca de Óleo Registrada",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
                padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <div style="text-align: center; margin-bottom: 20px;">
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
                </div>
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

      console.log("Dados recebidos:", JSON.stringify(req.body));

      // Inicializar o SDK com seu token de acesso
      const mp = new mercadopago.MercadoPagoConfig({
        accessToken: env.mercadopago.accessToken,
      });

      const paymentClient = new mercadopago.Payment(mp);

      // Mapear os parâmetros recebidos para os nomes esperados pelo Mercado Pago
      const {
        paymentType,
        transactionAmount,
        description,
        payer,
        externalReference,
        statementDescriptor,
        items,
      } = req.body;

      // Garantir que o valor da transação seja um número válido
      const amount = Number(parseFloat(transactionAmount));
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          error: "Invalid transaction_amount",
          details: "O valor da transação deve ser um número positivo",
        });
      }
      // Validação extra para boleto
      if (paymentType === "boleto" && amount < 3) {
        return res.status(400).json({
          error: "Valor mínimo para boleto é R$ 3,00",
          details: "O valor mínimo permitido para boleto é R$ 3,00",
        });
      }

      // Criar o objeto de pagamento com os nomes corretos de parâmetros
      const paymentData = {
        transaction_amount: amount,
        description: description,
        payer: payer,
      };

      // Adicionar external_reference (obrigatório)
      if (externalReference) {
        paymentData.external_reference = externalReference;
      } else if (req.body.externalReference) {
        paymentData.external_reference = req.body.externalReference;
      } else {
        paymentData.external_reference = `payment_${Date.now()}`;
      }

      // Adicionar statement_descriptor (recomendado)
      if (statementDescriptor) {
        paymentData.statement_descriptor = statementDescriptor;
      }

      // Adicionar informações do item (recomendado)
      if (items && items.length > 0) {
        paymentData.additional_info = {
          items: items,
        };
      }

      // Se for PIX, adicionar os parâmetros específicos
      if (paymentType === "pix") {
        paymentData.payment_method_id = "pix";
      // Se for boleto, adicionar os parâmetros específicos
      } else if (paymentType === "boleto") {
        paymentData.payment_method_id = "bolbradesco";
        // Garantir que todos os campos obrigatórios do endereço estejam presentes
        if (
          !payer.address ||
          !payer.address.zip_code ||
          !payer.address.street_name ||
          !payer.address.street_number ||
          !payer.address.neighborhood ||
          !payer.address.city ||
          !payer.address.federal_unit
        ) {
          return res.status(400).json({
            error: "Dados de endereço incompletos para boleto",
            details: "Todos os campos de endereço são obrigatórios para boleto",
          });
        }
      } else {
        return res.status(400).json({
          error: "Tipo de pagamento inválido",
          details: "paymentType deve ser 'pix' ou 'boleto'",
        });
      }

      // Adicione external_reference se vier do frontend
      if (req.body.externalReference) {
        paymentData.external_reference = req.body.externalReference;
      }

      console.log("Dados formatados para o Mercado Pago:", JSON.stringify(paymentData));

      // Criar o pagamento usando o SDK do Mercado Pago
      const payment = await paymentClient.create({body: paymentData});

      console.log("Resposta da API do Mercado Pago:", JSON.stringify(payment));

      res.json({
        status: payment.status,
        status_detail: payment.status_detail,
        id: payment.id,
        transaction_details: payment.transaction_details,
        payment_method: payment.payment_method,
        point_of_interaction: payment.point_of_interaction,
        external_reference: payment.external_reference,
      });
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);

      // Melhorar o log de erro para incluir mais detalhes
      if (error.response) {
        console.error("Detalhes do erro da API:", JSON.stringify(error.response.data));
        return res.status(500).json({
          error: "Erro ao processar pagamento",
          details: error.response.data || error.message,
        });
      }

      res.status(500).json({
        error: "Erro ao processar pagamento",
        details: error.message,
      });
    }
  });
});

/**
 * Envia uma notificação push para um usuário específico ou para administradores
 * @param {string|null} userId - O ID do usuário (email) para enviar a notificação, ou null se for notificação de admin
 * @param {Object} notification - Objeto contendo os detalhes da notificação
 * @param {string} notification.title - Título da notificação
 * @param {string} notification.body - Corpo da notificação
 * @param {Object} [notification.data] - Dados adicionais para a notificação
 * @param {boolean} [isAdminNotification=false] - Indica se é uma notificação para administradores
 * @return {Promise<void>}
 */
async function sendPaymentNotification(userId, notification, isAdminNotification = false) {
  try {
    const db = admin.firestore();

    // Garantir que notification.data seja um objeto
    if (!notification.data || typeof notification.data !== "object") {
      notification.data = {screen: "Financeiro"};
    }

    // Gerar um ID de grupo para relacionar notificações
    const notificationGroupId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Se for uma notificação de admin, buscar todos os admins
    if (isAdminNotification) {
      // Para notificações de admin, enviar para todos os usuários com isAdmin=true
      const adminUsersSnapshot = await db.collection("users")
          .where("isAdmin", "==", true)
          .get();

      if (adminUsersSnapshot.empty) {
        console.warn("Nenhum usuário admin encontrado para enviar notificação");
      } else {
        // Para cada admin, enviar notificação diretamente via FCM
        for (const adminDoc of adminUsersSnapshot.docs) {
          const adminId = adminDoc.id;
          const adminData = adminDoc.data();

          if (adminData.fcmToken) {
            try {
              // Enviar via FCM diretamente
              const message = {
                token: adminData.fcmToken,
                notification: {
                  title: notification.title,
                  body: notification.body,
                },
                data: notification.data || {},
                android: {
                  priority: "high",
                  notification: {
                    channelId: "default",
                  },
                },
              };

              await admin.messaging().send(message);
              console.log(`Notificação enviada diretamente para admin ${adminId}`);
            } catch (fcmError) {
              console.error(`Erro ao enviar notificação para admin ${adminId}:`, fcmError);

              // Se o token for inválido, criar uma solicitação de notificação
              if (fcmError.code === "messaging/invalid-registration-token" ||
                  fcmError.code === "messaging/registration-token-not-registered") {
                console.log(`Token inválido para admin ${adminId}, criando solicitação de notificação`);

                // Criar solicitação de notificação para processamento posterior
                const requestId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
                await db.collection("notificationRequests").doc(requestId).set({
                  userEmail: adminId,
                  title: notification.title,
                  body: notification.body,
                  data: notification.data || {},
                  status: "pending",
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  notificationGroupId: notificationGroupId,
                });
              }
            }
          } else {
            // Se o admin não tiver token, criar uma solicitação de notificação
            const requestId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            await db.collection("notificationRequests").doc(requestId).set({
              userEmail: adminId,
              title: notification.title,
              body: notification.body,
              data: notification.data || {},
              status: "pending",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              notificationGroupId: notificationGroupId,
            });
            console.log(`Solicitação de notificação criada para admin ${adminId} com ID: ${requestId}`);
          }
        }
      }

      // Salvar a notificação no Firestore para admins
      await db.collection("notifications").add({
        userType: "admin",
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        notificationGroupId: notificationGroupId,
        notificationType: "push",
      });

      console.log(`Notificação de admin salva no Firestore`);
      return;
    }

    // Para notificações de usuário normal
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`Usuário ${userId} não encontrado para enviar notificação`);
      return;
    }

    const user = userDoc.data();
    const fcmToken = user.fcmToken;

    if (!fcmToken) {
      console.warn(`Usuário ${userId} não tem token para notificações`);
      // Ainda assim, vamos salvar a notificação no Firestore
    } else {
      try {
        // Tentar enviar diretamente via FCM
        const message = {
          token: fcmToken,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
          android: {
            priority: "high",
            notification: {
              channelId: "default",
            },
          },
        };

        await admin.messaging().send(message);
        console.log(`Notificação enviada diretamente para usuário ${userId}`);
      } catch (fcmError) {
        console.error(`Erro ao enviar notificação diretamente para ${userId}:`, fcmError);

        // Criar solicitação de notificação para processamento posterior
        const requestId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await db.collection("notificationRequests").doc(requestId).set({
          userEmail: userId,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          notificationGroupId: notificationGroupId,
        });

        console.log(`Solicitação de notificação criada para usuário ${userId} com ID: ${requestId}`);
      }
    }

    // Salvar a notificação no Firestore para o usuário
    await db.collection("notifications").add({
      userId,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationGroupId: notificationGroupId,
      notificationType: "push",
    });

    console.log(`Notificação salva no Firestore para o usuário ${userId}`);
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

        if (!data || !data.userEmail) {
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

        // Normalizar os dados da notificação
        // Garantir que title e body sejam strings
        const title = typeof data.title === "string" ? data.title :
                    (data.title && typeof data.title.toString === "function" ?
                      data.title.toString() : "Notificação");
        const body = typeof data.body === "string" ? data.body :
                    (data.data && typeof data.data === "string" ?
                     data.data : "Você tem uma nova notificação");

        // Garantir que data seja um objeto
        const notificationData = typeof data.data === "object" ? data.data :
                               (typeof data.data === "string" ?
                                {message: data.data, screen: data.screen || "Financeiro"} :
                                {screen: data.screen || "Financeiro"});

        let response;
        let success = false;

        try {
          // Enviar via FCM diretamente (API V1)
          console.log("Enviando via FCM para usuário", data.userEmail);

          const fcmMessage = {
            token: userData.fcmToken,
            notification: {
              title: title,
              body: body,
            },
            data: notificationData,
            android: {
              priority: "high",
              notification: {
                channelId: data.hasImage ? "notifications_with_image" : "default",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
          };

          // Adicionar imagem se fornecida
          if (data.imageUrl) {
            // Configuração para Android
            if (!fcmMessage.android) fcmMessage.android = {};
            if (!fcmMessage.android.notification) fcmMessage.android.notification = {};
            fcmMessage.android.notification.imageUrl = data.imageUrl;

            // Configuração para iOS
            if (!fcmMessage.apns) fcmMessage.apns = {};
            if (!fcmMessage.apns.payload) fcmMessage.apns.payload = {};
            if (!fcmMessage.apns.payload.aps) fcmMessage.apns.payload.aps = {};
            fcmMessage.apns.payload.aps["mutable-content"] = 1;
            fcmMessage.apns.fcm_options = {image: data.imageUrl};
          }

          // Adicionar configurações específicas para Android se fornecidas
          if (data.android) {
            fcmMessage.android = {
              ...fcmMessage.android,
              ...data.android,
            };
          }

          // Adicionar configurações específicas para iOS se fornecidas
          if (data.apns) {
            fcmMessage.apns = {
              ...fcmMessage.apns,
              ...data.apns,
            };
          }

          response = await admin.messaging().send(fcmMessage);
          console.log("Notificação enviada via FCM:", response);
          success = true;
        } catch (fcmError) {
          console.error("Erro ao enviar via FCM para usuário", data.userEmail, ":", fcmError);

          // Se o token for inválido, remover do Firestore
          if (fcmError.code === "messaging/invalid-registration-token" ||
              fcmError.code === "messaging/registration-token-not-registered") {
            try {
              await admin.firestore().collection("users").doc(userDoc.id).update({
                fcmToken: admin.firestore.FieldValue.delete(),
              });
              console.log(`Token inválido removido para usuário ${data.userEmail}`);
            } catch (updateError) {
              console.error(`Erro ao remover token inválido:`, updateError);
            }
          }

          throw fcmError;
        }

        // Atualizar o status da solicitação
        await snapshot.ref.update({
          status: success ? "sent" : "error",
          response: success ? response : null,
          error: !success ? "Falha ao enviar notificação" : null,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Registrar a notificação enviada apenas se foi bem-sucedida
        if (success) {
          await admin.firestore().collection("notifications").add({
            userId: userDoc.id,
            email: data.userEmail,
            title: title,
            body: body,
            data: notificationData,
            sent: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            notificationGroupId: data.notificationGroupId || `auto_${Date.now()}`,
            notificationType: "push",
            imageUrl: data.imageUrl,
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


// Função agendada para enviar lembretes de pagamento
exports.sendPaymentReminders = onSchedule({
  schedule: "0 10 * * *", // Todos os dias às 10:00
  timeZone: "America/Sao_Paulo",
  retryCount: 3,
  region: "southamerica-east1", // Região do Brasil
}, async (event) => {
  try {
    console.log("Iniciando verificação de lembretes de pagamento...");

    // Buscar todos os contratos ativos
    const contratosSnapshot = await db.collection("contratos")
        .where("statusContrato", "==", true)
        .get();

    if (contratosSnapshot.empty) {
      console.log("Nenhum contrato ativo encontrado");
      return null;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia

    // Para cada contrato ativo
    for (const contratoDoc of contratosSnapshot.docs) {
      const contrato = contratoDoc.data();
      const contratoId = contratoDoc.id;

      // Verificar se o contrato tem usuário associado
      if (!contrato.userId && !contrato.cliente) {
        console.log(`Contrato ${contratoId} não tem usuário associado`);
        continue;
      }

      // Obter dados do usuário
      const userEmail = contrato.cliente;
      let userData;

      try {
        const userDoc = await db.collection("users").doc(userEmail).get();
        if (!userDoc.exists) {
          console.log(`Usuário ${userEmail} não encontrado`);
          continue;
        }
        userData = userDoc.data();
      } catch (error) {
        console.error(`Erro ao buscar usuário ${userEmail}:`, error);
        continue;
      }

      // Buscar aluguel associado ao contrato
      let aluguel;
      try {
        if (contrato.aluguelId) {
          const aluguelDoc = await db.collection("alugueis").doc(contrato.aluguelId).get();
          if (aluguelDoc.exists) {
            aluguel = aluguelDoc.data();
          }
        } else if (contrato.motoId) {
          const alugueisQuery = await db.collection("alugueis")
              .where("motoId", "==", contrato.motoId)
              .where("ativo", "==", true)
              .limit(1)
              .get();

          if (!alugueisQuery.empty) {
            aluguel = alugueisQuery.docs[0].data();
          }
        }

        if (!aluguel) {
          console.log(`Aluguel não encontrado para contrato ${contratoId}`);
          continue;
        }
      } catch (error) {
        console.error(`Erro ao buscar aluguel para contrato ${contratoId}:`, error);
        continue;
      }

      // Determinar tipo de recorrência e valor
      const tipoRecorrencia = contrato.tipoRecorrenciaPagamento || "mensal";
      const valorMensal = aluguel.valorMensal || 250;
      const valorSemanal = aluguel.valorSemanal || 70;
      const valor = tipoRecorrencia === "semanal" ? valorSemanal : valorMensal;

      // Buscar último pagamento aprovado
      let dataBase;
      try {
        const paymentsQuery = await db.collection("payments")
            .where("userEmail", "==", userEmail)
            .where("status", "==", "approved")
            .orderBy("dateCreated", "desc")
            .limit(1)
            .get();

        if (!paymentsQuery.empty) {
          const ultimoPagamento = paymentsQuery.docs[0].data();
          dataBase = ultimoPagamento.dateCreated.toDate();
        } else {
          // Se não houver pagamento, usar data de início do contrato
          dataBase = contrato.dataInicio.toDate();
        }

        dataBase.setHours(0, 0, 0, 0); // Normalizar para início do dia
      } catch (error) {
        console.error(`Erro ao buscar pagamentos para ${userEmail}:`, error);
        continue;
      }

      // Calcular próxima data de pagamento
      const proximaData = new Date(dataBase);

      if (tipoRecorrencia === "semanal") {
        // Para pagamento semanal
        proximaData.setDate(proximaData.getDate() + 7);

        // Ajustar para encontrar a data correta
        while (proximaData <= dataBase) {
          proximaData.setDate(proximaData.getDate() + 7);
        }
      } else {
        // Para pagamento mensal
        proximaData.setMonth(proximaData.getMonth() + 1);

        // Ajustar para encontrar a data correta
        while (proximaData <= dataBase) {
          proximaData.setMonth(proximaData.getMonth() + 1);
        }
      }

      // Calcular dias restantes
      const diasRestantes = Math.floor((proximaData - hoje) / (1000 * 60 * 60 * 24));

      // Verificar se já enviamos um lembrete hoje para este usuário
      const reminderRef = db.collection("paymentReminders")
          .doc(`${userEmail}_${hoje.toISOString().split("T")[0]}`);
      const reminderDoc = await reminderRef.get();

      if (reminderDoc.exists) {
        console.log(`Já enviamos um lembrete hoje para ${userEmail}, pulando`);
        continue;
      }

      // Determinar se devemos enviar lembrete hoje
      let deveEnviarLembrete = false;
      let tipoLembrete = "";

      if (tipoRecorrencia === "mensal") {
        // Para pagamento mensal: enviar no dia do pagamento e 3 dias antes
        if (diasRestantes === 0 || diasRestantes === 1 || diasRestantes === 2 || diasRestantes === 3) {
          deveEnviarLembrete = true;
          tipoLembrete = diasRestantes === 0 ? "vencimento" : "antecipado";
        }
      } else {
        // Para pagamento semanal: enviar apenas no dia do pagamento
        if (diasRestantes === 0) {
          deveEnviarLembrete = true;
          tipoLembrete = "vencimento";
        }
      }

      // Verificar se o pagamento está atrasado (até 3 dias)
      const diasAtraso = diasRestantes < 0 ? Math.abs(diasRestantes) : 0;
      if (diasAtraso > 0 && diasAtraso <= 3) {
        deveEnviarLembrete = true;
        tipoLembrete = "atraso";
      }

      // Se devemos enviar lembrete, preparar e enviar notificação e email
      if (deveEnviarLembrete) {
        console.log(`Enviando lembrete para ${userEmail}: ${tipoLembrete}, dias restantes: ${diasRestantes}`);

        // Preparar mensagens com base no tipo de lembrete
        let title; let body; let emailSubject; let emailContent; let emailH2Title;

        if (tipoLembrete === "vencimento") {
          title = "📅 Lembrete de Pagamento 📅";
          body = `Seu pagamento de R$ ${valor.toFixed(2)} vence hoje. Clique para pagar agora.`;
          emailSubject = "Lembrete de Pagamento - Papa Tango";
          emailH2Title = "Lembrete de Pagamento"; // sem "Papa Tango"
          emailContent = `
              <p>Olá, <strong>${userData.nome || "Cliente"}</strong>,</p>
              <p>Gostaríamos de lembrá-lo(a) que seu pagamento no valor de <strong>R$ ${valor.toFixed(2)}</strong> 
              vence hoje.</p>
              <p>Para sua comodidade, você pode realizar o pagamento diretamente pelo aplicativo Papa Tango.</p>
            `;
        } else if (tipoLembrete === "antecipado") {
          title = "📅 Lembrete de Pagamento 📅";
          body = `Seu pagamento de R$ ${valor.toFixed(2)} vence em ${diasRestantes} ${diasRestantes === 1 ?
              "dia" : "dias"}. Prepare-se!`;
          emailSubject = "Lembrete de Pagamento - Papa Tango";
          emailH2Title = "Lembrete de Pagamento"; // sem "Papa Tango"
          emailContent = `
              <p>Olá, <strong>${userData.nome || "Cliente"}</strong>,</p>
              <p>Gostaríamos de lembrá-lo(a) que seu pagamento no valor de <strong>R$ ${valor.toFixed(2)}</strong> 
              vencerá em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}.</p>
              <p>Para sua comodidade, você pode realizar o pagamento diretamente pelo aplicativo Papa Tango.</p>
            `;
        } else if (tipoLembrete === "atraso") {
          title = "⚠️ Pagamento em Atraso ⚠️";
          body = `Seu pagamento de R$ ${valor.toFixed(2)} está atrasado há ${diasAtraso} ${diasAtraso === 1 ?
              "dia" : "dias"}. Clique para regularizar.`;
          emailSubject = "Pagamento em Atraso - Papa Tango";
          emailH2Title = "Pagamento em Atraso"; // sem "Papa Tango"
          emailContent = `
              <p>Olá, <strong>${userData.nome || "Cliente"}</strong>,</p>
              <p>Notamos que seu pagamento no valor de <strong>R$ ${valor.toFixed(2)}</strong> está 
              atrasado há ${diasAtraso} ${diasAtraso === 1 ? "dia" : "dias"}.</p>
              <p>Para regularizar sua situação, você pode realizar o pagamento diretamente 
              pelo aplicativo Papa Tango.</p>
            `;
        }

        const logoUrl = "https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/" +
                        "o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14";

        // Preparar corpo completo do email
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
            padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${logoUrl}" alt="Logo Papa Tango" style="width: 70px; margin-bottom: 20px;">
              </div>
              <h2 style="color: #CB2921; text-align: center;">${emailH2Title}</h2>
              ${emailContent}
              <div style="text-align: center; margin: 30px 0;">
                <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; 
                padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Abrir no Aplicativo
                </a>
              </div>
              <p>Caso prefira, você também pode entrar em contato com nosso suporte para mais informações
              através do WhatsApp (85)99268-4035.</p>
              <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                Este é um email automático. Por favor, não responda a este email.
              </p>
            </div>
          `;

        // Enviar notificação push
        const requestId = `payment_reminder_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

        // Criar objeto de dados estruturado para a notificação
        const notificationData = {
          screen: "Financeiro",
          paymentAmount: valor.toFixed(2),
          paymentDate: proximaData.toISOString(),
          reminderType: tipoLembrete,
          daysRemaining: diasRestantes,
          daysOverdue: diasAtraso,
        };

        await db.collection("notificationRequests").doc(requestId).set({
          userEmail: userEmail,
          title: title,
          body: body,
          data: notificationData,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Enviar email
        const emailRequestId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await db.collection("emailRequests").doc(emailRequestId).set({
          to: userEmail,
          subject: emailSubject,
          html: emailBody,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Registrar que o lembrete foi enviado hoje
        await reminderRef.set({
          userEmail: userEmail,
          paymentDate: proximaData,
          paymentAmount: valor,
          diasRestantes: diasRestantes,
          diasAtraso: diasAtraso,
          tipoLembrete: tipoLembrete,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Lembrete enviado com sucesso para ${userEmail}`);
      }
    }

    console.log("Verificação de lembretes de pagamento concluída");
    return null;
  } catch (error) {
    console.error("Erro ao processar lembretes de pagamento:", error);
    return null;
  }
});

// Função agendada para enviar mensagens de aniversário
exports.sendBirthdayMessages = onSchedule({
  schedule: "0 10 * * *", // Todos os dias às 10:00
  timeZone: "America/Sao_Paulo",
  retryCount: 3,
  region: "southamerica-east1", // Região do Brasil
}, async (event) => {
  try {
    console.log("Iniciando verificação de aniversários...");

    // Obter a data atual no formato brasileiro (DD/MM)
    const hoje = new Date();
    const diaAtual = hoje.getDate().toString().padStart(2, "0");
    const mesAtual = (hoje.getMonth() + 1).toString().padStart(2, "0");
    const dataAtualFormatada = `${diaAtual}/${mesAtual}`;

    console.log(`Verificando aniversariantes do dia: ${dataAtualFormatada}`);

    // Buscar todos os usuários
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      console.log("Nenhum usuário encontrado");
      return null;
    }

    // Para cada usuário, verificar se é aniversário
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Verificar se o usuário tem data de nascimento
      if (!userData.dataNascimento) {
        continue;
      }

      // Extrair dia e mês da data de nascimento (formato esperado: DD/MM/YYYY)
      let diaNascimento; let mesNascimento;

      // Verificar o formato da data de nascimento
      if (userData.dataNascimento.includes("/")) {
        // Formato DD/MM/YYYY
        const partesData = userData.dataNascimento.split("/");
        if (partesData.length >= 2) {
          diaNascimento = partesData[0].padStart(2, "0");
          mesNascimento = partesData[1].padStart(2, "0");
        }
      } else if (userData.dataNascimento.includes("-")) {
        // Formato YYYY-MM-DD
        const partesData = userData.dataNascimento.split("-");
        if (partesData.length >= 3) {
          diaNascimento = partesData[2].padStart(2, "0");
          mesNascimento = partesData[1].padStart(2, "0");
        }
      } else {
        console.log(`Formato de data inválido para usuário ${userId}: ${userData.dataNascimento}`);
        continue;
      }

      if (!diaNascimento || !mesNascimento) {
        console.log(`Não foi possível extrair dia e mês para usuário ${userId}`);
        continue;
      }

      const dataNascimentoFormatada = `${diaNascimento}/${mesNascimento}`;

      // Verificar se é aniversário do usuário
      if (dataNascimentoFormatada === dataAtualFormatada) {
        console.log(`Hoje é aniversário de ${userData.nome || userData.nomeCompleto || userId}!`);

        // Verificar se o usuário tem um contrato ativo
        let temContratoAtivo = false;
        try {
          const contratosQuery = await db.collection("contratos")
              .where("cliente", "==", userId)
              .where("statusContrato", "==", true)
              .limit(1)
              .get();

          temContratoAtivo = !contratosQuery.empty;
        } catch (error) {
          console.error(`Erro ao verificar contratos do usuário ${userId}:`, error);
        }

        // Verificar se o usuário tem avatar
        let avatarUrl = null;
        try {
          // O ID do documento do usuário é o email dele
          const userEmail = userId; // userId na função é o email do usuário

          // Verificar se existe um arquivo avatar.jpg no storage usando o email
          const avatarRef = admin.storage().bucket().file(`profile/${userEmail}/avatar.jpg`);
          const [exists] = await avatarRef.exists();

          if (exists) {
            // Usar o formato correto de URL do Firebase Storage
            const bucketName = admin.storage().bucket().name;
            const encodedFilePath = encodeURIComponent(`profile/${userEmail}/avatar.jpg`);
            avatarUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedFilePath}?alt=media`;

            console.log(`Avatar encontrado para usuário ${userEmail}: ${avatarUrl}`);
          } else {
            console.log(`Nenhum avatar encontrado para usuário ${userEmail}`);
          }
        } catch (error) {
          console.error(`Erro ao buscar avatar do usuário ${userId}:`, error);
        }

        // Preparar mensagens personalizadas com base no status do contrato
        let title; let body; let emailSubject; let emailContent;

        if (temContratoAtivo) {
          // Mensagem para usuários com contrato ativo
          title = "🎂 Feliz Aniversário! 🎉";
          body = `Parabéns ${userData.nome || userData.nomeCompleto || ""}! Obrigado por confiar em nossos serviços.`;
          emailSubject = "Feliz Aniversário! 🎂 - Papa Tango";
          emailContent = `
            <p>Olá, <strong>${userData.nome || userData.nomeCompleto || "Cliente"}</strong>!</p>
            <p>Hoje é um dia especial e queremos celebrar com você! 🎉</p>
            <p>Em nome de toda a equipe Papa Tango, desejamos um <strong>Feliz Aniversário</strong> 
            repleto de alegria, saúde e realizações!</p>
            <p>Queremos agradecer pela confiança em nossos serviços. É um prazer tê-lo(a) como cliente e 
            poder fazer parte da sua jornada sobre duas rodas.</p>
            <p>Continue aproveitando a liberdade e praticidade que sua moto proporciona!</p>
            <p>Se precisar de qualquer coisa, estamos sempre à disposição.</p>
          `;
        } else {
          // Mensagem para usuários sem contrato ativo
          title = "🎂 Feliz Aniversário! 🎉";
          body = `Parabéns ${userData.nome || userData.nomeCompleto || ""}! Temos ótimas motos esperando por você.`;
          emailSubject = "Feliz Aniversário! 🎂 - Papa Tango";
          emailContent = `
            <p>Olá, <strong>${userData.nome || userData.nomeCompleto || "Cliente"}</strong>!</p>
            <p>Hoje é um dia especial e queremos celebrar com você! 🎉</p>
            <p>Em nome de toda a equipe Papa Tango, desejamos um <strong>Feliz Aniversário</strong> repleto de alegria, 
            saúde e realizações!</p>
            <p>Que tal comemorar essa data especial alugando uma moto? Temos excelentes opções esperando por você!</p>
            <p>Nosso catálogo está repleto de motos de qualidade, com valores acessíveis.</p>
            <p>Se precisar de qualquer coisa, estamos sempre à disposição.</p>
          `;
        }

        // Verificar se já enviamos uma mensagem de aniversário hoje para este usuário
        const birthdayRef = db.collection("birthdayMessages")
            .doc(`${userId}_${hoje.toISOString().split("T")[0]}`);
        const birthdayDoc = await birthdayRef.get();

        if (birthdayDoc.exists) {
          console.log(`Já enviamos uma mensagem de aniversário hoje para ${userId}, pulando`);
          continue;
        }

        // Enviar notificação push
        try {
          const requestId = `birthday_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

          // Garantir que o objeto data seja válido
          const notificationData = {
            screen: "Inicio",
            type: "birthday",
            avatarUrl: avatarUrl || null,
          };

          await db.collection("notificationRequests").doc(requestId).set({
            userEmail: userId,
            title: title,
            body: body,
            data: notificationData,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            notificationType: "push",
            // Adicionar notificationGroupId para agrupar notificações relacionadas
            notificationGroupId: `birthday_${userId}_${hoje.toISOString().split("T")[0]}`,
          });

          console.log(`Solicitação de notificação de aniversário criada para ${userId}`);
        } catch (error) {
          console.error(`Erro ao criar solicitação de notificação para ${userId}:`, error);
        }

        // Enviar email
        try {
          // Preparar o corpo completo do email
          const logoUrl = "https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/" +
                          "o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14";

          let avatarHtml = "";
          if (avatarUrl) {
            avatarHtml = `
              <div style="text-align: center; margin: 20px 0;">
                <img src="${avatarUrl}" alt="Foto de perfil" 
                     style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid 
                     #CB2921;">
              </div>
            `;
          }

          const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
            padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${logoUrl}" alt="Logo Papa Tango" style="width: 70px; margin-bottom: 20px;">
              </div>
              <h2 style="color: #CB2921; text-align: center;">🎂 Feliz Aniversário! 🎉</h2>
              
              ${avatarHtml}
              
              ${emailContent}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="papamotors://inicio" style="background-color: #CB2921; color: white; 
                padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Abrir o Aplicativo
                </a>
              </div>
              
              <p>Atenciosamente,</p>
              <p>Equipe Papa Tango - Aluguel de Motos</p>
              <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                Este é um email automático. Por favor, não responda a este email.
              </p>
            </div>
          `;

          const emailRequestId = `birthday_email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          await db.collection("emailRequests").doc(emailRequestId).set({
            to: userId,
            subject: emailSubject,
            html: emailBody,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            notificationType: "email",
            // Adicionar notificationGroupId para agrupar notificações relacionadas
            notificationGroupId: `birthday_${userId}_${hoje.toISOString().split("T")[0]}`,
          });

          console.log(`Solicitação de email de aniversário criada para ${userId}`);
        } catch (emailError) {
          console.error(`Erro ao criar solicitação de email para ${userId}:`, emailError);
        }

        // Registrar que a mensagem de aniversário foi enviada hoje
        await birthdayRef.set({
          userId: userId,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          contratoAtivo: temContratoAtivo,
          avatarUrl: avatarUrl,
        });

        console.log(`Mensagem de aniversário enviada com sucesso para ${userId}`);
      }
    }

    console.log("Verificação de aniversários concluída");
    return null;
  } catch (error) {
    console.error("Erro ao processar mensagens de aniversário:", error);
    return null;
  }
});


// Função HTTP para enviar mensagens em massa
exports.enviarMensagemEmMassaHttp = functions.https.onRequest(async (req, res) => {
  // Aplicar CORS
  return cors(req, res, async () => {
    try {
      console.log("Função enviarMensagemEmMassaHttp chamada");

      // Verificar se é uma requisição POST
      if (req.method !== "POST") {
        return res.status(405).json({error: "Método não permitido"});
      }

      // Obter o token de ID do cabeçalho Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("Token de autenticação não fornecido");
        return res.status(401).json({error: "Token de autenticação não fornecido"});
      }

      const idToken = authHeader.split("Bearer ")[1];
      console.log("Token recebido (primeiros 20 caracteres):", idToken.substring(0, 20) + "...");

      // Verificar o token de ID
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log("Token verificado com sucesso. UID:", decodedToken.uid);
      } catch (error) {
        console.error("Erro ao verificar token:", error);
        return res.status(401).json({error: "Token de autenticação inválido"});
      }

      // Verificar se o usuário é admin
      const userEmail = decodedToken.email;
      console.log("Email do usuário:", userEmail);

      const userDoc = await db.collection("users").doc(userEmail).get();

      if (!userDoc.exists) {
        console.error("Usuário não encontrado:", userEmail);
        return res.status(403).json({error: "Usuário não encontrado"});
      }

      console.log("Dados do usuário:", userDoc.data());

      // Verificar se o usuário é admin (usando isAdmin ou role)
      if (!userDoc.data().isAdmin && userDoc.data().role !== "admin") {
        console.error("Usuário não é admin:", userEmail);
        return res.status(403).json({error: "Você não tem permissão para usar esta função"});
      }

      // Processar a solicitação
      const data = req.body;
      console.log("Dados recebidos:", data);

      // Extrair dados da solicitação
      const {
        titulo,
        mensagem,
        tipoUsuarios, // 'todos', 'contratosAtivos', 'contratosInativos'
        enviarEmail,
        enviarNotificacao,
        imagemUrl,
        documentoUrl,
      } = data;

      if (!titulo || !mensagem) {
        return res.status(400).json({error: "Título e mensagem são obrigatórios"});
      }

      // Construir a consulta com base no tipo de usuários
      const usersQuery = db.collection("users");
      let usersSnapshot;

      if (tipoUsuarios === "contratosAtivos" || tipoUsuarios === "contratosInativos") {
        // Primeiro, buscar os IDs dos contratos com o status desejado
        const statusContrato = tipoUsuarios === "contratosAtivos";
        const contratosSnapshot = await db.collection("contratos")
            .where("statusContrato", "==", statusContrato)
            .get();

        if (contratosSnapshot.empty) {
          return res.json({
            success: true,
            message: "Nenhum contrato encontrado com o status especificado.",
          });
        }

        // Extrair os IDs dos clientes dos contratos
        const clientesIds = [];
        contratosSnapshot.forEach((doc) => {
          const contrato = doc.data();
          if (contrato.cliente) {
            clientesIds.push(contrato.cliente);
          }
        });

        if (clientesIds.length === 0) {
          return res.json({
            success: true,
            message: "Nenhum cliente encontrado nos contratos.",
          });
        }

        // Limitar a consulta aos usuários com esses IDs
        // Firestore não suporta consultas in com mais de 10 valores, então precisamos dividir
        const batchSize = 10;
        const userBatches = [];

        for (let i = 0; i < clientesIds.length; i += batchSize) {
          const batch = clientesIds.slice(i, i + batchSize);
          userBatches.push(batch);
        }

        // Array para armazenar todos os documentos de usuários
        usersSnapshot = {docs: []};

        // Buscar cada lote de usuários
        for (const batch of userBatches) {
          const batchSnapshot = await db.collection("users")
              .where(admin.firestore.FieldPath.documentId(), "in", batch)
              .get();

          batchSnapshot.forEach((doc) => {
            usersSnapshot.docs.push(doc);
          });
        }
      } else {
        // Para 'todos', buscar todos os usuários
        usersSnapshot = await usersQuery.get();
      }

      if (!usersSnapshot || usersSnapshot.empty || usersSnapshot.docs.length === 0) {
        return res.json({
          success: true,
          message: "Nenhum usuário encontrado com os critérios especificados.",
        });
      }

      // Processar cada usuário e enviar mensagens
      let sucessos = 0;
      let falhas = 0;
      const detalhes = [];

      // Gerar um ID de grupo para todas as notificações desta campanha
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Para cada usuário, enviar email e/ou notificação
      for (const userDoc of usersSnapshot.docs) {
        const usuario = userDoc.data();
        const userId = userDoc.id;
        const userEmail = usuario.email || userId;

        try {
          // Enviar notificação push se solicitado
          if (enviarNotificacao) {
            // Criar um ID único para a solicitação
            const requestId = `mass_notification_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

            // Dados adicionais para a notificação - garantir que seja um objeto válido
            const notificationData = {
              screen: "Inicio",
              campaignId: campaignId,
              type: "massMessage",
            };

            // Se tiver uma imagem, adicionar ao objeto data
            if (imagemUrl) {
              notificationData.imageUrl = imagemUrl;
            }

            // Se tiver um documento, adicionar ao objeto data
            if (documentoUrl) {
              notificationData.documentUrl = documentoUrl;
            }

            // Configurações específicas para Android e iOS
            let androidConfig = {};
            let apnsConfig = {};

            // Se tiver uma imagem, adicionar configurações específicas para cada plataforma
            if (imagemUrl) {
              // Configuração para Android - Big Picture Style
              androidConfig = {
                notification: {
                  imageUrl: imagemUrl,
                  style: "BIGPICTURE",
                  picture: imagemUrl,
                },
              };

              // Configuração para iOS - Attachment
              apnsConfig = {
                payload: {
                  aps: {
                    "mutable-content": 1,
                  },
                  fcm_options: {
                    image: imagemUrl,
                  },
                },
              };
            }

            // Criar um documento de solicitação de notificação no Firestore
            await db.collection("notificationRequests").doc(requestId).set({
              userEmail: userEmail,
              title: titulo,
              body: mensagem,
              data: notificationData,
              status: "pending",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              // Adicionar configurações específicas de plataforma
              android: androidConfig,
              apns: apnsConfig,
              // Flag para indicar que esta notificação tem imagem
              hasImage: !!imagemUrl,
              imageUrl: imagemUrl,
              notificationGroupId: campaignId,
              notificationType: "push",
            });

            // Também salvar a notificação na coleção de notificações
            await db.collection("notifications").add({
              userId: userId,
              title: titulo,
              body: mensagem,
              data: notificationData,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              imageUrl: imagemUrl, // Salvar a URL da imagem para exibição no app
              notificationGroupId: campaignId,
              notificationType: "push",
            });
          }

          // Enviar email se solicitado
          if (enviarEmail) {
            // Preparar o conteúdo do email
            const logoUrl = "https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/" +
                          "o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14";

            let conteudoHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
              padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="${logoUrl}"
                       alt="Logo Papa Tango" style="width: 70px; margin-bottom: 20px;">
                </div>
                <h2 style="color: #CB2921; text-align: center;">${titulo}</h2>
                <p>Olá, <strong>${usuario.nome || "Cliente"}</strong>,</p>
                <div style="margin: 20px 0; line-height: 1.5;">
                  ${mensagem.replace(/\n/g, "<br>")}
                </div>
            `;

            // Adicionar imagem se fornecida
            if (imagemUrl) {
              conteudoHtml += `
                <div style="text-align: center; margin: 20px 0;">
                  <img src="${imagemUrl}" alt="Imagem" style="max-width: 100%; border-radius: 5px;">
                </div>
              `;
            }

            // Adicionar link para documento se fornecido
            if (documentoUrl) {
              conteudoHtml += `
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${documentoUrl}"
                     style="background-color: #CB2921; color: white; padding: 10px 20px;
                            text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Visualizar Documento
                  </a>
                </div>
              `;
            }

            // Finalizar o HTML do email
            conteudoHtml += `
                <p>Fale conosco através do WhatsApp clicando no botão abaixo</p>
              <br>
              <br>
              <div style="text-align: center;">
                  <a href="https://wa.me/5585992684035?text=Quero%20falar%20com%20o%20atendente"
                    style="background-color: #CB2921;
                            color: white;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;">
                      Falar com Atendente
                  </a>
              </div>
              <br>
              <br>
              <p>Atenciosamente,</p>
              <p>Equipe Papa Tango - Aluguel de Motos</p>
              </div>
            `;

            // Criar solicitação de email no Firestore
            const emailRequestId = `mass_email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            await db.collection("emailRequests").doc(emailRequestId).set({
              to: userEmail,
              subject: titulo,
              html: conteudoHtml,
              status: "pending",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              notificationGroupId: campaignId,
              notificationType: "email",
            });

            // Também salvar uma notificação no app para o email enviado
            await db.collection("notifications").add({
              userId: userId,
              title: titulo,
              body: mensagem.substring(0, 100) + (mensagem.length > 100 ? "..." : ""),
              data: {
                screen: "Inicio",
                campaignId: campaignId,
                type: "email",
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              notificationGroupId: campaignId,
              notificationType: "email",
              imageUrl: imagemUrl,
            });
          }

          // Registrar sucesso
          sucessos++;
          detalhes.push({
            usuario: userEmail,
            status: "sucesso",
          });
        } catch (error) {
          console.error(`Erro ao enviar mensagem para ${userEmail}:`, error);
          falhas++;
          detalhes.push({
            usuario: userEmail,
            status: "falha",
            erro: error.message,
          });
        }
      }

      // Registrar a campanha para referência futura
      await db.collection("messageCampaigns").doc(campaignId).set({
        titulo: titulo,
        mensagem: mensagem,
        tipoUsuarios: tipoUsuarios,
        enviarEmail: enviarEmail,
        enviarNotificacao: enviarNotificacao,
        imagemUrl: imagemUrl || null,
        documentoUrl: documentoUrl || null,
        createdBy: userEmail,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sucessos: sucessos,
        falhas: falhas,
        total: sucessos + falhas,
      });

      return res.json({
        success: true,
        message: `Mensagens enviadas com sucesso para ${sucessos} usuários. Falhas: ${falhas}.`,
        campaignId: campaignId,
        detalhes: {
          sucessos,
          falhas,
          detalhes,
        },
      });
    } catch (error) {
      console.error("Erro ao enviar mensagens em massa:", error);
      return res.status(500).json({error: error.message});
    }
  });
});


/**
 * Função para lidar com webhooks do Mercado Pago
 */
exports.webhook = functions.https.onRequest(async (req, res) => {
  // Log dos headers recebidos para debug
  console.log("Headers recebidos:", JSON.stringify(req.headers));

  // Obter o corpo da requisição
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const bodyStr = rawBody.toString();

  // Log do corpo da requisição para debug
  console.log("Corpo da requisição:", bodyStr);

  // --- VALIDAÇÃO DA ASSINATURA CONFORME DOCUMENTAÇÃO OFICIAL ---
  const signatureHeader = req.headers["x-signature"];
  const requestIdHeader = req.headers["x-request-id"];

  let isValidSignature = false;

  if (signatureHeader) {
    console.log("Header x-signature recebido:", signatureHeader);

    // Extrair ts e v1 do header x-signature
    const parts = signatureHeader.split(",");
    let ts;
    let receivedSignature;

    parts.forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey === "ts") {
          ts = trimmedValue;
        } else if (trimmedKey === "v1") {
          receivedSignature = trimmedValue;
        }
      }
    });

    if (ts && receivedSignature) {
      console.log("Timestamp extraído:", ts);
      console.log("Assinatura recebida:", receivedSignature);

      // Obter o data.id do corpo da requisição
      let dataId;
      try {
        const webhookData = JSON.parse(bodyStr);
        dataId = webhookData.data && webhookData.data.id;
      } catch (e) {
        console.error("Erro ao analisar o corpo da requisição:", e);
      }

      if (dataId) {
        // Construir o template conforme documentação
        // id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
        let signatureTemplate = `id:${dataId};`;

        // Adicionar request-id se disponível
        if (requestIdHeader) {
          signatureTemplate += `request-id:${requestIdHeader};`;
        }

        // Adicionar timestamp
        signatureTemplate += `ts:${ts};`;

        console.log("Template de assinatura:", signatureTemplate);

        // Calcular a assinatura HMAC SHA256
        const crypto = require("crypto");
        const calculatedSignature = crypto
            .createHmac("sha256", env.mercadopago.webhookSecret)
            .update(signatureTemplate)
            .digest("hex");

        console.log("Assinatura calculada:", calculatedSignature);

        // Verificar se as assinaturas correspondem
        isValidSignature = calculatedSignature === receivedSignature;

        if (isValidSignature) {
          console.log("Assinatura de webhook válida!");
        } else {
          console.warn("Assinatura de webhook inválida");
          console.log("Template usado:", signatureTemplate);
          console.log("Chave secreta usada (primeiros 4 caracteres):",
              env.mercadopago.webhookSecret.substring(0, 4) + "...");
        }
      } else {
        console.warn("Não foi possível extrair data.id do corpo da requisição");
      }
    } else {
      console.warn("Formato de x-signature inválido ou incompleto");
    }
  } else {
    console.warn("Header x-signature não encontrado");
  }

  if (!isValidSignature) {
    console.log("Validação de assinatura falhou, retornando 200 OK sem processamento");
    return res.status(200).send("OK");
  }

  // --- SÓ CHAME O CORS DEPOIS DA VALIDAÇÃO ---
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        console.log("Método não permitido:", req.method);
        return res.status(200).send("OK");
      }

      let webhookData;
      try {
        webhookData = typeof req.body === "object" ? req.body : JSON.parse(bodyStr);
      } catch (e) {
        console.error("Erro ao analisar o corpo da requisição:", e);
        return res.status(200).send("OK");
      }

      console.log("Webhook data processado:", webhookData);
      const {type, data, action} = webhookData;

      if (type === "payment" || action === "payment.updated" || action === "payment.created") {
        const paymentId = data.id;

        // Verificar se é um teste de webhook
        const isWebhookTest = paymentId === "123456" || webhookData.id === "123456" || webhookData.live_mode === false;
        if (isWebhookTest) {
          console.log("Teste de webhook detectado.");
          return res.status(200).send("OK");
        }

        // Usar a API REST como método principal para obter detalhes do pagamento
        let payment = null;
        const axios = require("axios");

        try {
          console.log(`Tentando obter detalhes do pagamento ${paymentId} via API REST...`);
          const paymentResponse = await axios.get(
              `https://api.mercadopago.com/v1/payments/${paymentId}`,
              {
                headers: {
                  "Authorization": `Bearer ${env.mercadopago.accessToken}`,
                },
              },
          );

          payment = paymentResponse.data;
          console.log("Detalhes do pagamento obtidos com sucesso via API REST");
        } catch (apiError) {
          console.error(`Erro ao obter pagamento via API REST: ${apiError.message}`);

          // Se a API REST falhar, tentar com o SDK como fallback
          try {
            console.log(`Tentando obter detalhes do pagamento ${paymentId} via SDK (fallback)...`);
            const mp = new mercadopago.MercadoPagoConfig({
              accessToken: env.mercadopago.accessToken,
            });
            const paymentClient = new mercadopago.Payment(mp);

            const paymentResponse = await paymentClient.get({id: paymentId});
            payment = paymentResponse.response;

            if (!payment) {
              console.log("Pagamento não encontrado na primeira tentativa via SDK, aguardando 1 segundo...");
              await new Promise((r) => setTimeout(r, 1000));
              const retryResponse = await paymentClient.get({id: paymentId});
              payment = retryResponse.response;
            }

            if (payment) {
              console.log("Detalhes do pagamento obtidos com sucesso via SDK (fallback)");
            } else {
              throw new Error("Pagamento não encontrado após tentativas via SDK");
            }
          } catch (sdkError) {
            console.warn(`Erro ao obter pagamento via SDK: ${sdkError.message}`);

            // Se ambos os métodos falharem, retornar
            if (apiError.response && apiError.response.status === 404) {
              console.error(`Pagamento ${paymentId} não encontrado em nenhuma tentativa.`);
              return res.status(200).send("OK");
            }

            // Se for outro erro, lançar para ser capturado pelo try/catch externo
            throw apiError;
          }
        }

        if (!payment) {
          console.error(`Não foi possível obter detalhes do pagamento ${paymentId}.`);
          return res.status(200).send("OK");
        }

        console.log(`Detalhes do pagamento ${paymentId}:`, JSON.stringify(payment));

        // Extrair informações relevantes do pagamento
        const {
          status,
          status_detail: statusDetail,
          transaction_amount: transactionAmount,
          date_approved: dateApproved,
          date_created: dateCreated,
          external_reference: externalReference,
          payment_method_id: paymentMethodId,
          payer,
        } = payment;

        const db = admin.firestore();

        // Buscar o documento diretamente pelo ID do pagamento
        // Como sabemos que o frontend usa o ID do pagamento como ID do documento
        const paymentDocRef = db.collection("payments").doc(paymentId.toString());
        const paymentDoc = await paymentDocRef.get();

        if (paymentDoc.exists) {
          console.log(`Documento de pagamento encontrado com ID: ${paymentId}`);
        } else {
          console.log(`Documento de pagamento não encontrado com ID: ${paymentId}. Será criado.`);
        }

        // Obter dados existentes ou objeto vazio se não existir
        const paymentData = paymentDoc.exists ? paymentDoc.data() : {};

        // Verificar se o status mudou
        const statusChanged = paymentData.status !== status;
        const previousStatus = paymentData.status || null;

        if (statusChanged) {
          console.log(`Status do pagamento mudou: ${previousStatus || "novo"} -> ${status}`);
        }

        // Adicionar campo para controlar notificações já enviadas
        const notificationsSent = paymentData.notificationsSent || {
          pending: false,
          approved: false,
          rejected: false,
        };

        // Preparar dados para atualização
        const paymentUpdateData = {
          status,
          statusDetail,
          amount: transactionAmount,
          dateCreated: new Date(dateCreated),
          dateApproved: dateApproved ? new Date(dateApproved) : null,
          externalReference,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentMethod: paymentData.paymentMethod || paymentMethodId,
          paymentDetails: payment,
          notificationsSent,
        };

        // Atualizar o documento usando merge para preservar campos existentes
        await paymentDocRef.set(paymentUpdateData, {merge: true});
        console.log(`Documento de pagamento ${paymentId} atualizado com sucesso`);

        // Determinar o usuário para enviar notificação
        let userId = paymentData.userId;
        let userEmail = paymentData.userEmail;

        // Se não temos o ID do usuário, mas temos o email, use o email
        if (!userId && userEmail) {
          userId = userEmail;
        }

        // Se ainda não temos o ID do usuário, tente extrair do external_reference
        if (!userId && externalReference) {
          if (externalReference.startsWith("user_")) {
            userId = externalReference.replace("user_", "");
          } else if (externalReference.includes("@")) {
            // Se o external_reference parece um email, use-o
            userId = externalReference;
            userEmail = externalReference;
          }
        }

        // Se ainda não temos o ID do usuário, tente extrair do pagamento
        if (!userId && payer && payer.email) {
          userId = payer.email;
          userEmail = payer.email;
        }

        // Enviar notificação se tivermos um ID de usuário
        if (userId) {
          // Gerar um ID de grupo para relacionar notificações do mesmo pagamento
          const notificationGroupId = `payment_${paymentId}_${Date.now()}`;

          // 1. Notificação de pagamento aprovado - enviar imediatamente
          if (status === "approved" && !notificationsSent.approved) {
            console.log(`Enviando notificação de pagamento aprovado para o usuário: ${userId}`);

            // Usar a função sendPaymentNotification existente
            await sendPaymentNotification(userId, {
              title: "Pagamento Recebido 💰",
              body: `Seu pagamento de R$ ${transactionAmount.toFixed(2)} foi recebido com sucesso 🎉`,
              data: {
                screen: "Financeiro",
                paymentId: paymentId,
                amount: transactionAmount,
                status: status,
                type: "payment_approved",
                notificationGroupId: notificationGroupId,
              },
            });

            // Enviar email de confirmação se tivermos o email do usuário
            if (userEmail) {
              try {
                // Criar solicitação de email no Firestore para ser processada pela função processEmailRequests
                await db.collection("emailRequests").add({
                  to: userEmail,
                  subject: `Pagamento de R$ ${transactionAmount.toFixed(2)} Recebido - Papa Tango`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
                    padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                      <div style="text-align: center; margin-bottom: 20px;">
                        <img src="cid:Logo" alt="Logo Papa Tango"
                         style="width: 70px; margin-bottom: 20px;">
                      </div>
                      <h2>Pagamento Recebido!</h2>
                      <p>Olá, ${paymentData.userName || "Cliente"}</p>
                      <p>Seu pagamento de <strong>R$ ${transactionAmount.toFixed(2)}</strong> 
                      foi recebido com sucesso.</p>
                      <p>Detalhes do pagamento:</p>
                      <ul style="list-style-type: none; padding: 0;">
                        <li>ID do pagamento: ${paymentId}</li>
                        <li>Data: ${new Date(dateApproved || dateCreated).toLocaleString("pt-BR")}</li>
                        <li>Método: ${paymentMethodId || paymentData.paymentMethod || "Não especificado"}</li>
                      </ul>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; 
                        padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                          Abrir no Aplicativo
                        </a>
                      </div>
                      <p>Obrigado por utilizar nossos serviços!</p>
                      <p>Equipe Papa Tango</p>
                      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                        Este é um email automático. Por favor, não responda a este email.
                      </p>
                    </div>
                  `,
                  status: "pending",
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  attachments: [{
                    filename: "Logo.png",
                    path: path.join(__dirname, "src/assets/Logo.png"),
                    cid: "Logo",
                  }],
                  notificationGroupId: notificationGroupId,
                  notificationType: "email",
                });

                console.log(`Solicitação de email de pagamento aprovado criada para ${userEmail}`);
              } catch (emailError) {
                console.error(`Erro ao criar solicitação de email: ${emailError.message}`);
              }
            }

            // Atualizar flag de notificação enviada
            await paymentDocRef.update({
              "notificationsSent.approved": true,
            });
          } else if (["rejected", "cancelled"].includes(status) &&
                  !notificationsSent.rejected &&
                  statusChanged &&
                  previousStatus !== "in_process" &&
                  previousStatus !== "pending") {
            // 2. Notificação de pagamento rejeitado/cancelado
            console.log(`Enviando notificação de pagamento não aprovado para o usuário: ${userId}`);

            // Usar a função sendPaymentNotification existente
            await sendPaymentNotification(userId, {
              title: "⚠️ Atenção: Pagamento não aprovado ⚠️",
              body: `Seu pagamento de R$ ${transactionAmount.toFixed(2)} não foi aprovado.`,
              data: {
                screen: "Financeiro",
                paymentId: paymentId,
                amount: transactionAmount,
                status: status,
                statusDetail: statusDetail,
                type: "payment_rejected",
                notificationGroupId: notificationGroupId,
              },
            });

            // Enviar email se tivermos o email do usuário
            if (userEmail) {
              try {
                await db.collection("emailRequests").add({
                  to: userEmail,
                  subject: "Pagamento Não Aprovado - Papa Tango",
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
                    padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                      <div style="text-align: center; margin-bottom: 20px;">
                        <img src="cid:Logo" alt="Logo Papa Tango"
                         style="width: 70px; margin-bottom: 20px;">
                      </div>
                      <h2>Pagamento Não Aprovado</h2>
                      <p>Olá, ${paymentData.userName || "Cliente"}</p>
                      <p>Seu pagamento de <strong>R$ ${transactionAmount.toFixed(2)}</strong> 
                      não foi aprovado.</p>
                      <p>Motivo: ${statusDetail || "Não especificado"}</p>
                      <p>Por favor, tente novamente ou entre em contato com nosso suporte.</p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; 
                        padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                          Tentar Novamente
                        </a>
                      </div>
                      <br>
                      <div style="text-align: center;">
                          <a href="https://wa.me/5585992684035?text=Quero%20falar%20com%20o%20suporte
                          .%20Sobre%20o%20pagamento%20não%20aprovado%20de%20R$%20${transactionAmount.toFixed(2)}"
                            style="background-color: #25D366;
                                    color: white;
                                    padding: 10px 20px;
                                    text-decoration: none;
                                    border-radius: 5px;
                                    font-weight: bold;">
                              Falar com Suporte
                          </a>
                      </div>
                      <p>Equipe Papa Tango</p>
                      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                        Este é um email automático. Por favor, não responda a este email.
                      </p>
                    </div>
                  `,
                  status: "pending",
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  attachments: [{
                    filename: "Logo.png",
                    path: path.join(__dirname, "src/assets/Logo.png"),
                    cid: "Logo",
                  }],
                  notificationGroupId: notificationGroupId,
                  notificationType: "email",
                });

                console.log(`Solicitação de email de pagamento não aprovado criada para ${userEmail}`);
              } catch (emailError) {
                console.error(`Erro ao criar solicitação de email: ${emailError.message}`);
              }
            }

            // Atualizar flag de notificação enviada
            await paymentDocRef.update({
              "notificationsSent.rejected": true,
            });
          } else if (status === "pending") {
            // 3. Notificação de pagamento pendente
            console.log(`Pagamento pendente detectado. Não enviando notificação imediata.`);

            // Verificar se o pagamento foi criado há mais de 20 minutos
            const paymentDate = new Date(dateCreated);
            const now = new Date();
            const minutesDiff = (now - paymentDate) / (1000 * 60);

            // Se o pagamento foi criado há mais de 20 minutos e não enviamos notificação ainda
            if (minutesDiff >= 20 && !notificationsSent.pending) {
              console.log(`Pagamento pendente há mais de 20 minutos. Enviando notificação.`);

              // Usar a função sendPaymentNotification existente
              await sendPaymentNotification(userId, {
                title: "Pagamento Pendente",
                body: `Seu pagamento de R$ ${transactionAmount.toFixed(2)} está pendente de confirmação.
                \nSe você já realizou o pagamento, aguarde a confirmação do processamento.`,
                data: {
                  screen: "Financeiro",
                  paymentId: paymentId,
                  amount: transactionAmount,
                  status: status,
                  type: "payment_pending",
                  notificationGroupId: notificationGroupId,
                },
              });

              // Enviar email se tivermos o email do usuário
              if (userEmail) {
                try {
                  await db.collection("emailRequests").add({
                    to: userEmail,
                    subject: "Pagamento Pendente - Papa Tango",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
                        padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                          <div style="text-align: center; margin-bottom: 20px;">
                            <img src="cid:Logo" alt="Logo Papa Tango"
                            style="width: 70px; margin-bottom: 20px;">
                          </div>
                        <h2>Pagamento Pendente</h2>
                        <p>Olá, ${paymentData.userName || "Cliente"}</p>
                        <p>Seu pagamento de <strong>R$ ${transactionAmount.toFixed(2)}</strong> 
                        está pendente de confirmação.</p>
                        <p>Se você já realizou o pagamento, aguarde a confirmação do processamento.</p>
                        <p>Pagamentos realizados com boleto levam de 1 a 3 dias úteis para serem compensados</p>
                        <p>Caso não tenha realizado o pagamento, por favor, conclua-o para evitar o 
                        cancelamento da locação.</p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; 
                          padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Verificar no Aplicativo
                          </a>
                        </div>
                        <p>Equipe Papa Tango</p>
                        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                          Este é um email automático. Por favor, não responda a este email.
                        </p>
                      </div>
                    `,
                    status: "pending",
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    attachments: [{
                      filename: "Logo.png",
                      path: path.join(__dirname, "src/assets/Logo.png"),
                      cid: "Logo",
                    }],
                    notificationGroupId: notificationGroupId,
                    notificationType: "email",
                  });

                  console.log(`Solicitação de email de pagamento pendente criada para ${userEmail}`);
                } catch (emailError) {
                  console.error(`Erro ao criar solicitação de email: ${emailError.message}`);
                }
              }

              // Atualizar flag de notificação enviada
              await paymentDocRef.update({
                "notificationsSent.pending": true,
              });
            }
          }

          // 4. Notificação para administradores sobre mudanças de status
          if (statusChanged) {
            try {
              // Enviar notificação para administradores sobre a mudança de status usando a função existente
              await sendPaymentNotification(null, {
                title: `Pagamento ${status === "approved" ? "Aprovado" :
                        status === "rejected" ? "Rejeitado" :
                        status === "cancelled" ? "Cancelado" : "Atualizado"}`,
                body: `Pagamento de R$ ${transactionAmount.toFixed(2)} do usuário ${userEmail} foi ${
                        status === "approved" ? "aprovado" :
                        status === "rejected" ? "rejeitado" :
                        status === "cancelled" ? "cancelado" :
                        "atualizado para " + status}`,
                data: {
                  screen: "Admin",
                  params: {screen: "Pagamentos"},
                  paymentId: paymentId,
                  amount: transactionAmount,
                  previousStatus: previousStatus,
                  newStatus: status,
                  userEmail: userEmail,
                  type: "admin_payment_status_change",
                },
              }, true); // true indica que é uma notificação para administradores

              console.log(`Notificação de mudança de status enviada para administradores`);
            } catch (adminNotificationError) {
              console.error(`Erro ao enviar notificação para administradores: ${adminNotificationError.message}`);
            }
          }
        } else {
          console.log(`Não foi possível determinar o usuário para enviar notificação.`);
          // Mesmo sem usuário identificado, notificar administradores sobre o pagamento
          try {
            await sendPaymentNotification(null, {
              title: `Pagamento ${status} sem usuário identificado`,
              body: `Pagamento de R$ ${transactionAmount.toFixed(2)} foi recebido, mas não foi possível identificar 
              o usuário.`,
              data: {
                screen: "Admin",
                params: {screen: "Payments"},
                paymentId: paymentId,
                amount: transactionAmount,
                status: status,
                type: "admin_payment_no_user",
              },
            }, true); // true indica que é uma notificação para administradores

            console.log(`Notificação enviada para administradores sobre pagamento sem usuário identificado`);
          } catch (error) {
            console.error(`Erro ao enviar notificação para administradores 
              sobre pagamento sem usuário: ${error.message}`);
          }
        }
      } else {
        console.log(`Tipo de evento ignorado: ${type || action}`);
      }

      res.status(200).send("OK");
    } catch (err) {
      console.error("Erro ao processar webhook:", err);
      res.status(200).send("OK");
    }
  });
});


/**
 * Função para verificar status do pagamento
 */
exports.checkPaymentStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Verificar se o método é GET
      if (req.method !== "GET") {
        return res.status(405).json({error: "Método não permitido"});
      }

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


