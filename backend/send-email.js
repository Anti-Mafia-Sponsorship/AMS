// Netlify Function за изпращане на имейли
const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const data = JSON.parse(event.body);
  const {variant, name, email, phone, walletAddress, bnbAmount, txHash, notes, timestamp} = data;
  
  // Email to Owner
  const ownerEmail = {
    to: process.env.OWNER_EMAIL,
    from: 'noreply@ams-token.org',
    subject: `🎁 Ново AMS Дарение - Вариант ${variant}`,
    html: `
      <h2>Ново Дарение!</h2>
      <p><strong>Име:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Телефон:</strong> ${phone}</p>
      <p><strong>Wallet:</strong> ${walletAddress}</p>
      <p><strong>BNB:</strong> ${bnbAmount}</p>
      ${txHash ? `<p><strong>TX:</strong> ${txHash}</p>` : ''}
      <p><strong>Време:</strong> ${new Date(timestamp).toLocaleString('bg-BG')}</p>
    `
  };
  
  // Email to Donor
  let donorEmail = null;
  if (email && email !== 'Не е предоставен') {
    donorEmail = {
      to: email,
      from: 'noreply@ams-token.org',
      subject: '✅ Твоето AMS Дарение е Получено!',
      html: `<h2>Благодарим!</h2><p>Получихме ${bnbAmount} BNB от ${walletAddress}</p><p>Токените ще бъдат изпратени скоро.</p>`
    };
  }
  
  try {
    await sgMail.send(ownerEmail);
    if (donorEmail) await sgMail.send(donorEmail);
    return {statusCode: 200, body: JSON.stringify({success: true})};
  } catch (error) {
    return {statusCode: 500, body: JSON.stringify({error: error.message})};
  }
};
