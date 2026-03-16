const mongoose = require("mongoose");
const Supplier = require("../modal/supplier.modal.js");
const validator = require("validator");

const createSupplier = async (req, res) => {
  try {
    const userId = req.user._id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company" });
    }

    let { supplier_name, supplier_email, supplier_phone, supplier_address } =
      req.body;

    supplier_name = supplier_name?.trim();
    supplier_email = supplier_email?.trim()?.toLowerCase();
    supplier_phone = supplier_phone?.trim();
    if (
      !supplier_name ||
      !supplier_email ||
      !supplier_phone ||
      !supplier_address
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (typeof supplier_address !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Supplier Address is Required" });
    }

    if (!validator.isEmail(supplier_email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email Format" });
    }

    if (!validator.isMobilePhone(supplier_phone, "any")) {
      return res
        .status(400)
        .json({ success: false, message: "Imvalid Mobile Number" });
    }

    const {
      address_line_1,
      address_line_2,
      address_line_3,
      address_line_4,
      city,
      state,
      country,
      zipcode,
    } = supplier_address;

    supplier_address.address_line_1 = address_line_1?.trim();
    supplier_address.address_line_2 = address_line_2?.trim() || "";
    supplier_address.address_line_3 = address_line_3?.trim() || "";
    supplier_address.address_line_4 = address_line_4?.trim() || "";
    supplier_address.city = city?.trim()?.toLowerCase();
    supplier_address.state = state?.trim()?.toLowerCase();
    supplier_address.country = country?.trim()?.toLowerCase();
    supplier_address.zipcode = zipcode?.trim();

    if (!address_line_1 || !city || !state || !country || !zipcode) {
      return res
        .status(400)
        .json({ success: false, message: "Required address fields missing" });
    }

    const supplier = await Supplier.findOne({
      companyId,
      $or: [{ supplier_email }, { supplier_phone }],
    })
      .active()
      .lean();
    if (supplier) {
      return res
        .status(400)
        .json({ success: false, message: "Supplier Already exists" });
    }

    const newSupplier = await Supplier.create({
      supplier_name,
      supplier_email,
      supplier_phone,
      supplier_address,
      companyId,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier Created Successfully!",
      data: newSupplier,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Supplier already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company" });
    }

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid supplier" });
    }

    const supplier = await Supplier.findOne({
      _id: supplierId,
      companyId,
    })
      .active()
      .lean();
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "NO Supplier Found" });
    }
    return res.status(200).json({
      success: true,
      message: "Supplier Fetched Successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getAllSupplier = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }

    const {
      page_no = 1,
      page_size = 10,
      search = "",
      city,
      state,
      country,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const pageNo = Math.max(parseInt(page_no), 1);
    const pageSize = Math.max(parseInt(page_size), 1);
    const skip = (pageNo - 1) * pageSize;

    const filter = {
      companyId,
      isDeleted: false,
      isActive: true,
    };

    if (search) {
      filter.$or = [
        { supplier_name: { $regex: search, $options: "i" } },
        { supplier_email: { $regex: search, $options: "i" } },
        { supplier_phone: { $regex: search, $options: "i" } },
      ];
    }

    if (city) {
      filter["supplier_address.city"] = city?.trim()?.toLowerCase();
    }
    if (state) {
      filter["supplier_address.state"] = state?.trim()?.toLowerCase();
    }
    if (country) {
      filter["supplier_address.country"] = country?.trim()?.toLowerCase();
    }

    const sortOption = {
      [sort]: order === "arc" ? 1 : -1,
    };

    const supplier = await Supplier.find(filter)
      .sort(sortOption)
      .active()
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total_suppliers = await Supplier.countDocuments(filter);
    return res.status(200).json({
      success: true,
      message: "All Supplier Fetched Successfully",
      page_no: pageNo,
      page_size: pageSize,
      total_records: total_suppliers,
      total_pages: Math.ceil(total_suppliers / pageSize),
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const supplierUpdate = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Supplier" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Compnay" });
    }

    const updateData = {};

    if (req.body.supplier_name !== undefined)
      updateData.supplier_name = req.body.supplier_name.trim();

    if (req.body.supplier_email !== undefined)
      updateData.supplier_email = req.body.supplier_email.trim().toLowerCase();

    if (req.body.supplier_phone !== undefined)
      updateData.supplier_phone = req.body.supplier_phone.trim();

    if (req.body.supplier_address) {
      const address = req.body.supplier_address;

      if (address.address_line_1 !== undefined)
        updateData["supplier_address.address_line_1"] =
          address.address_line_1.trim();

      if (address.address_line_2 !== undefined)
        updateData["supplier_address.address_line_2"] =
          address.address_line_2.trim();

      if (address.address_line_3 !== undefined)
        updateData["supplier_address.address_line_3"] =
          address.address_line_3.trim();

      if (address.address_line_4 !== undefined)
        updateData["supplier_address.address_line_4"] =
          address.address_line_4.trim();

      if (address.city !== undefined)
        updateData["supplier_address.city"] = address.city.trim().toLowerCase();

      if (address.state !== undefined)
        updateData["supplier_address.state"] = address.state
          .trim()
          .toLowerCase();

      if (address.country !== undefined)
        updateData["supplier_address.country"] = address.country
          .trim()
          .toLowerCase();

      if (address.zipcode !== undefined)
        updateData["supplier_address.zipcode"] = address.zipcode.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields provided to update" });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: supplierId, companyId, isDeleted: false, isActive: true },
      { $set: updateData },
      { new: true },
    ).lean();

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier Not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier Updated Successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const toggleSupplierStatus = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res
        .status(400)
        .json({ success: false, message: "Supplier invalid" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Copany invalid" });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "must have a boolean value" });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: supplierId, companyId, isDeleted: false },
      { $set: { isActive } },
      { new: true },
    ).lean();

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "supplier not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Supplier ${supplier.isActive ? "activated" : "deactivated"} successfully`,
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const softDeleteSupplier = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res
        .status(400)
        .json({ success: false, message: "Supplier Invalid" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Company Invalid" });
    }
    const supplier = await Supplier.findOneAndUpdate(
      { _id: supplierId, companyId, isDeleted: true },
      { $set: { isDeleted: true } },
      { new: true },
    ).lean();

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier Not Found!" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Supplier Soft Deleted Successfully!" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteSupplierById = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const companyId = req.user.companyId;
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Supplier" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }

    const supplier = await Supplier.findOneAndDelete({
      _id: supplierId,
      companyId,
    }).lean();

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "No Supplier Found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Supplier Deleted Successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteAllSupplier = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Company" });
    }

    const supplier = await Supplier.deleteMany({
      companyId,
    });

    if (supplier.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No Supplier Found" });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: `${supplier.deletedCount} Supplier Deleted Successfully`,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createSupplier,
  getSupplierById,
  getAllSupplier,
  supplierUpdate,
  toggleSupplierStatus,
  softDeleteSupplier,
  deleteSupplierById,
  deleteAllSupplier,
};
