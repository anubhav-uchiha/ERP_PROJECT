const mongoose = require("mongoose");
const Tax = require("../modal/tax.model.js");

const createTax = async (req, res) => {
  try {
    const { _id: userId, companyId } = req.user;
    let { name, rate } = req.body;

    rate = Number(rate);

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid User" });

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });

    if (isNaN(rate) || rate < 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid tax rate" });

    const allowedGST = [0, 5, 12, 18, 28];

    if (!allowedGST.includes(rate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST rate as per Indian rules",
      });
    }

    const existing = await Tax.findOne({
      rate,
      companyId,
      isActive: true,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Tax already exists",
      });
    }

    const tax = await Tax.create({
      name: name.trim(),
      rate,
      companyId,
      isCustom: false,
    });

    return res.status(201).json({
      success: true,
      message: "Tax created successfully",
      data: tax,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getTaxes = async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    const taxes = await Tax.find({
      $or: [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { companyId: null },
      ],
      isActive: true,
    })
      .sort({ rate: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Taxes fetched successfully",
      count: taxes.length,
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateTaxStatus = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { taxId, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    if (!mongoose.Types.ObjectId.isValid(taxId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Tax Id" });

    const tax = await Tax.findOneAndUpdate(
      {
        _id: taxId,
        companyId,
      },
      { isActive },
      { new: true },
    );

    if (!tax)
      return res.status(404).json({
        success: false,
        message: "Tax not found",
      });

    return res.status(200).json({
      success: true,
      message: "Tax updated successfully",
      data: tax,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createTax,
  getTaxes,
  updateTaxStatus,
};
