const mongoose = require("mongoose");
const Product = require("../modal/product.modal");
const Supplier = require("../modal/supplier.modal");

const createProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }

    let {
      product_name,
      product_code,
      product_category,
      product_price,
      product_cost_price,
      supplierId,
      stock_quantity,
      unit,
      product_description,
    } = req.body;

    if (
      !product_name ||
      !product_code ||
      !product_category ||
      product_price === undefined ||
      product_cost_price === undefined ||
      !supplierId ||
      stock_quantity === undefined ||
      !unit
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    product_name = product_name?.trim()?.toLowerCase();
    product_code = product_code?.trim()?.toUpperCase();
    product_category = product_category?.trim()?.toLowerCase();
    unit = unit?.trim()?.toLowerCase();

    product_price = Number(product_price);
    product_cost_price = Number(product_cost_price);
    stock_quantity = Number(stock_quantity);

    if (
      isNaN(product_price) ||
      isNaN(product_cost_price) ||
      isNaN(stock_quantity)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Price and stock must be a number" });
    }
    if (product_price < 0 || product_cost_price < 0 || stock_quantity < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Values cannot be negative" });
    }
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Supplier" });
    }

    const supplier = await Supplier.findOne({ _id: supplierId, companyId })
      .active()
      .lean();

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    const product = await Product.findOne({ product_code, companyId })
      .active()
      .lean();

    if (product) {
      return res
        .status(400)
        .json({ success: false, message: "Product Already Exists" });
    }

    const newProduct = await Product.create({
      product_name,
      product_code,
      product_category,
      product_price,
      product_cost_price,
      supplierId,
      stock_quantity,
      unit,
      product_description: product_description?.trim() || "",
      companyId,
    });

    return res.status(201).json({
      success: true,
      message: "Product Added Successfully",
      data: newProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate product",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const getAllProducts = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const {
      page_no = 1,
      page_size = 10,
      search = "",
      category,
      sort = "createdAt",
      order = "desc",
    } = req.query;
    const pageNo = Math.max(parseInt(page_no) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(page_size) || 10, 1), 100);
    const skip = (pageNo - 1) * pageSize;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company",
      });
    }

    const matchStage = {
      companyId,
      isDeleted: false,
      isActive: true,
    };

    if (search) {
      matchStage.$or = [
        { product_name: { $regex: search, $options: "i" } },
        { product_code: { $regex: search, $options: "i" } },
        { product_category: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      matchStage.product_category = category?.trim()?.toLowerCase();
    }

    const sortOption = {
      [sort]: order === "asc" ? 1 : -1,
    };
    const product = await Product.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplier",
        },
        $unwind: {
          path: "$supplier",
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
                project_name: 1,
                project_code: 1,
                project_category: 1,
                project_price: 1,
                stock_quantity: 1,
                unit: 1,
                createdAt: 1,
                supplier: {
                  _id: "$supplier._id",
                  supplier_name: "$supplier.supplier_name",
                  supplier_email: "$supplier.supplier_email",
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const products = result[0].data;
    const total_records = result[0].totalCount[0]?.count || 0;

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product Not Found" });
    }
    return res.status(200).json({
      success: false,
      message: "Product fetched successfully",
      page_no: pageNo,
      page_size: pageSize,
      total_records,
      total_pages: Math.ceil(total_records / pageSize),
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const getProductById = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const toggleProductStatus = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const softDeleteProduct = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = { createProduct, getAllProducts };
