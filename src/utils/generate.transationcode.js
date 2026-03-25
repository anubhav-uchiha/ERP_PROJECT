const generateTransactionCode = () => {
  return "INV-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
};

module.exports = generateTransactionCode;
