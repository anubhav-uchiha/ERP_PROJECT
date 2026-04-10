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
    const companyId = req.user.companyId;
    const userId = req.user._id;

    const {
      page_no = 1,
      page_size = 10,
      search = "",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const pageNo = Math.max(parseInt(page_no) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(page_size) || 10, 1), 100);
    const skip = (pageNo - 1) * pageSize;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ sucess: false, message: "INVALID USER" });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    const filter = {
      companyId,
      isDeleted: false,
      isActive: true,
    };

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const sortOption = {
      [sort]: order === "asc" ? 1 : -1,
    };

    const taxes = await Tax.find(filter)
      .sort(sortOption)
      .active()
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total_taxes = await Tax.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Taxes fetched successfully",
      page_no: pageNo,
      page_size: pageSize,
      total_records: total_taxes,
      total_pages: Math.ceil(total_taxes / pageSize),
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getTaxById = async (req, res) => {
  try {
    const taxId = req.params.id;
    const companyId = req.user.companyId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company" });
    }
    if (!mongoose.Types.ObjectId.isValid(taxId)) {
      return res.status(400).json({ success: false, message: "Invalid tax" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }

    const tax = await Tax.findOne({
      _id: taxId,
      companyId,
      isDeleted: false,
      isActive: true,
    }).lean();

    if (!tax) {
      return res.status(404).json({ success: false, message: "NO Tax Found" });
    }
    return res.status(200).json({
      success: true,
      message: "Tax Fetched Successfully",
      data: tax,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server error",
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

const toggleTaxStatus = async (req, res) => {
  try {
    const taxId = req.params.id;
    const companyId = req.user.companyId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(taxId)) {
      return res.status(400).json({ success: false, message: "Tax invalid" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "User invalid" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Company invalid" });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "must have a boolean value" });
    }

    const tax = await Tax.findOneAndUpdate(
      { _id: taxId, companyId, isDeleted: false },
      { $set: { isActive } },
      { new: true },
    ).lean();

    if (!tax) {
      return res.status(404).json({ success: false, message: "tax not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Tax ${tax.isActive ? "activated" : "deactivated"} successfully`,
      data: tax,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const softDeleteTax = async (req, res) => {
  try {
    const taxId = req.params.id;
    const companyId = req.user.companyId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(taxId)) {
      return res.status(400).json({ success: false, message: "Tax Invalid" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "User Invalid" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Company Invalid" });
    }
    const tax = await Tax.findOneAndUpdate(
      { _id: taxId, companyId, isDeleted: false, isActive: true },
      { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } },
      { new: true },
    ).lean();

    if (!tax) {
      return res
        .status(404)
        .json({ success: false, message: "Tax Not Found!" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Tax Soft Deleted Successfully!" });
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
  getTaxById,
  updateTaxStatus,
  toggleTaxStatus,
  softDeleteTax,
};
