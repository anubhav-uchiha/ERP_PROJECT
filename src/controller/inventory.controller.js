const mongoose = require("mongoose");
const Inventory = require("../modal/inventory.modal.js");
const Product = require("../modal/product.modal.js");
const generateTransactionCode = require("../utils/generate.transationcode.js");

const addStock = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { _id: userId, companyId } = req.user;
    let { productId, quantity, note, unitPrice = 0 } = req.body;

    quantity = Number(quantity);
    unitPrice = Number(unitPrice);

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid User" });

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product" });

    if (quantity === undefined || quantity === null)
      return res
        .status(400)
        .json({ success: false, message: "Quantity is required" });

    if (isNaN(quantity) || quantity <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be positive" });

    if (isNaN(unitPrice) || unitPrice < 0)
      return res
        .status(400)
        .json({ success: false, message: "Unit price cannot be negative" });

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        companyId,
        isDeleted: false,
        isActive: true,
      },
      { $inc: { stock_quantity: quantity } },
      { new: true, session },
    );

    if (!product) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const inventory = await Inventory.create(
      [
        {
          productId,
          companyId,
          transactionCode: generateTransactionCode(),
          type: "IN",
          quantity,
          unitPrice,
          totalValue: quantity * unitPrice,
          referenceType: "MANUAL",
          note: note?.trim() || "",
          createdBy: userId,
          stockAfterTransaction: product.stock_quantity,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Stock added successfully",
      data: inventory[0],
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

const removeStock = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { _id: userId, companyId } = req.user;
    let { productId, quantity, note, unitPrice = 0 } = req.body;

    quantity = Number(quantity);
    unitPrice = Number(unitPrice);

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid User" });

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product" });

    if (quantity === undefined || quantity === null)
      return res
        .status(400)
        .json({ success: false, message: "Quantity is required" });

    if (isNaN(quantity) || quantity <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be positive" });

    if (isNaN(unitPrice) || unitPrice < 0)
      return res
        .status(400)
        .json({ success: false, message: "Unit price cannot be negative" });

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        companyId,
        stock_quantity: { $gte: quantity },
        isDeleted: false,
        isActive: true,
      },
      { $inc: { stock_quantity: -quantity } },
      { new: true, session },
    );

    if (!product) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Product not found or insufficient stock",
      });
    }

    const inventory = await Inventory.create(
      [
        {
          productId,
          companyId,
          transactionCode: generateTransactionCode(),
          type: "OUT",
          quantity,
          unitPrice,
          totalValue: quantity * unitPrice,
          referenceType: "MANUAL",
          note: note?.trim() || "",
          createdBy: userId,
          stockAfterTransaction: product.stock_quantity,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Stock removed successfully",
      data: inventory[0],
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

const adjustStock = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { _id: userId, companyId } = req.user;
    let { productId, quantity, type, note, unitPrice = 0 } = req.body;

    quantity = Number(quantity);
    unitPrice = Number(unitPrice);
    type = type?.toUpperCase();

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid User" });

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product" });

    if (quantity === undefined || quantity === null)
      return res
        .status(400)
        .json({ success: false, message: "Quantity is required" });

    if (isNaN(quantity) || quantity <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be positive" });

    if (isNaN(unitPrice) || unitPrice < 0)
      return res
        .status(400)
        .json({ success: false, message: "Unit price cannot be negative" });

    if (!["IN", "OUT"].includes(type))
      return res
        .status(400)
        .json({ success: false, message: "Invalid adjustment type" });

    const query = {
      _id: productId,
      companyId,
      isDeleted: false,
      isActive: true,
    };

    if (type === "OUT") {
      query.stock_quantity = { $gte: quantity };
    }

    const product = await Product.findOneAndUpdate(
      query,
      {
        $inc: { stock_quantity: type === "IN" ? quantity : -quantity },
      },
      { new: true, session },
    );

    if (!product) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Product not found or insufficient stock",
      });
    }

    const inventory = await Inventory.create(
      [
        {
          productId,
          companyId,
          transactionCode: generateTransactionCode(),
          type,
          quantity,
          unitPrice,
          totalValue: quantity * unitPrice,
          referenceType: "ADJUSTMENT",
          note: note?.trim() || "",
          createdBy: userId,
          stockAfterTransaction: product.stock_quantity,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      data: inventory[0],
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

const getInventoryHistory = async (req, res) => {
  try {
    const { _id: userId, companyId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid User" });

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    const {
      page_no = 1,
      page_size = 10,
      productId,
      type,
      startDate,
      endDate,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const pageNo = Math.max(parseInt(page_no) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(page_size) || 10, 1), 100);
    const skip = (pageNo - 1) * pageSize;

    const matchStage = {
      companyId: new mongoose.Types.ObjectId(companyId),
      isDeleted: false,
      isActive: true,
    };

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid Product" });

      matchStage.productId = new mongoose.Types.ObjectId(productId);
    }

    if (type) {
      const t = type.toUpperCase();
      if (!["IN", "OUT"].includes(t))
        return res
          .status(400)
          .json({ success: false, message: "Invalid type" });

      matchStage.type = t;
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const result = await Inventory.aggregate([
      { $match: matchStage },
      {
        $facet: {
          data: [
            { $sort: { [sort]: order === "asc" ? 1 : -1 } },
            { $skip: skip },
            { $limit: pageSize },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const total_records = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      page_no: pageNo,
      page_size: pageSize,
      total_records,
      total_pages: Math.ceil(total_records / pageSize),
      data: result[0]?.data || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const { _id: userId, companyId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid User" });

    if (!mongoose.Types.ObjectId.isValid(companyId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });

    const { threshold = 10, productId } = req.query;
    const limit = Number(threshold);

    if (isNaN(limit) || limit < 0)
      return res.status(400).json({
        success: false,
        message: "Threshold must be valid",
      });

    const matchStage = {
      companyId: new mongoose.Types.ObjectId(companyId),
      stock_quantity: { $lte: limit },
    };

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid Product" });

      matchStage._id = new mongoose.Types.ObjectId(productId);
    }

    const products = await Product.find(matchStage)
      .active()
      .select("product_name product_code stock_quantity")
      .sort({ stock_quantity: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Low stock products fetched successfully",
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  addStock,
  removeStock,
  adjustStock,
  getInventoryHistory,
  getLowStockProducts,
};
