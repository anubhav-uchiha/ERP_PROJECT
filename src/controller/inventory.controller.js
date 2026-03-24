const mongoose = require("mongoose");
const Inventory = require("../modal/inventory.modal.js");
const Product = require("../modal/product.modal.js");

const addStock = async (req, res, next) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const userId = req.user._id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isvalid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User" });
    }

    if (!mongoose.Types.ObjectId.isvalid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }
    const { productId, quantity, note } = req.body;

    if (!mongoose.Types.ObjectId.isvalid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product" });
    }

    if (!productId || !quantity === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "All field required" });
    }

    quantity = Number(quantity);

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity must be a postive number",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      companyId,
      isDeleted: false,
      isActive: true,
    }).session(session);

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const newStock = product.stock_quantity + quantity;

    const inventory = await Inventory.create(
      {
        productId,
        companyId,
        type: "IN",
        quantity,
        referenceType: "MANUAL",
        referenceId: null,
        note: note?.trim() || "",
        createdBy: userId,
        stockAfterTransaction: newStock,
      },
      { session },
    );
    product.stock_quantity = newStock;
    await product.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Stock added successfully",
      data: inventory[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const removeStock = async (req, res, next) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const userId = req.user._id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isvalid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User" });
    }

    if (!mongoose.Types.ObjectId.isvalid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }
    const { productId, quantity, note } = req.body;

    if (!mongoose.Types.ObjectId.isvalid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product" });
    }

    if (!productId || !quantity === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "All field required" });
    }

    quantity = Number(quantity);

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity must be a postive number",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      companyId,
      isDeleted: false,
      isActive: true,
    }).session(session);

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.stock_quantity < quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Insufficient Stock",
      });
    }

    const newStock = product.stock_quantity - quantity;

    const inventory = await Inventory.create(
      {
        productId,
        companyId,
        type: "OUT",
        quantity,
        referenceType: "MANUAL",
        referenceId: null,
        note: note?.trim() || "",
        createdBy: userId,
        stockAfterTransaction: newStock,
      },
      { session },
    );
    product.stock_quantity = newStock;
    await product.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Stock added successfully",
      data: inventory[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getInventoryHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isvalid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User" });
    }

    if (!mongoose.Types.ObjectId.isvalid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }

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

    if (!mongoose.Types.ObjectId.isvalid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product" });
    }

    const matchStage = {
      productId: new mongoose.Types.ObjectId(productId),
      companyId: new mongoose.Types.ObjectId(companyId),
      isDeleted: false,
      isActive: true,
    };

    if (type) {
      matchStage.type = type.toUpperCase();
    }
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const sortOption = {
      [sort]: order === "asc" ? 1 : -1,
    };

    const result = await Inventory.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [
            { $sort: sortOption },
            { $skip: skip },
            { $limit: pageSize },
            {
              $project: {
                type: 1,
                quantity: 1,
                stockAfterTransaction: 1,
                referenceType: 1,
                note: 1,
                createdAt: 1,
                product: {
                  _id: "$product._id",
                  product_name: "$product.product_name",
                  product_code: "$product.product_code",
                },
                user: {
                  _id: "$user._id",
                  first_name: "$user.first_name",
                  last_name: "$user.last_name",
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const inventory = result[0].data;
    const total_records = result[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      page_no: pageNo,
      page_size: pageSize,
      total_records,
      total_pages: matchStage.ceil(total_records / pageSize),
      data: inventory,
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
    const userId = req.user._id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isvalid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User" });
    }

    if (!mongoose.Types.ObjectId.isvalid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }
    const { threshold = 10, productId } = req.query;
    if (!mongoose.Types.ObjectId.isvalid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product" });
    }
    const limit = Number(threshold);
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({
        success: false,
        message: "Threshold must be a valid number",
      });
    }
    const products = await Product.find({
      companyId,
      productId,
      stock_quantity: { $lte: limt },
    })
      .active()
      .select("product_name product_code stock_quantity unit product_category")
      .sort({ stock_quantity: 1 })
      .lean();
    return res.status(200).json({
      success: true,
      message: "Low Stock products fetched successfully",
      count: product.length,
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
  getInventoryHistory,
  getLowStockProducts,
};
