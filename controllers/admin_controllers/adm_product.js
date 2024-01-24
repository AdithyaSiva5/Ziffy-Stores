const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");

const categoryCollection = require("../../models/category");
const productCollection = require("../../models/product");

// render product list page
module.exports.getProductList = async (req, res) => {
  try {
    const productdata = await productCollection.find();
    res.render("admin-productlist", { productdata });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// render add product page
module.exports.getAddProduct = async (req, res) => {
  try {
    const categorydata = await categoryCollection.find();
    const categories = Array.isArray(categorydata)
      ? categorydata
      : [categorydata];
    res.render("admin-addproduct", { categories });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// adding product
module.exports.postProduct = async (req, res) => {
  try {
    if (req.files) {
      const productImg = req.files;
      let arr = [];

      for (const element of productImg) {
        const filePath = `uploads/cropperd_${element.originalname}`;
        const cropped = await sharp(element.path)
          .resize({ width: 500, height: 500, fit: "cover" })
          .toFile(filePath);
        arr.push({ path: filePath });
      }

      const imageIds = arr.map((productImg) => productImg.path);

      await productCollection.create({
        productName: req.body.productName,
        productDiscription: req.body.productDiscription,
        productCategory: req.body.productCategory,
        productBrand: req.body.productBrand,
        regularPrice: req.body.regularPrice,
        sellingPrice: req.body.sellingPrice,
        productSize: req.body.productSize,
        productStock: req.body.productStock,
        productStatus: req.body.productStatus,
        productImg: imageIds,
      });

      const productdata = await productCollection.find();
      // res.render("admin-productlist", { productdata });
       res.status(200).json({ message: "Product Added" });
      console.log(imageIds);
    } else {
      res.status(400).send("No images selected for upload");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// delete a product
module.exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const result = await productCollection.deleteOne({ _id: productId });
    if (result.deletedCount === 1) {
      res.redirect("/admin/product-list");
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// render product edit page
module.exports.editProduct = async (req, res) => {
  try {
    const product = req.params.productId;
    const productdata = await productCollection.findOne({ _id: product });
    const categorydata = await categoryCollection.find();
    res.render("admin-editproduct", { productdata, categorydata });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//saving edited details into the db

module.exports.updateProduct = async (req, res) => {
  try {
    // console.log(editId.productName)
    const editId = req.params.productId;
    const existingProduct = await productCollection.findById(editId);

    const {
      productName,
      productDiscription,
      productCategory,
      productBrand,
      regularPrice,
      sellingPrice,
      productSize,
      productStock,
      productStatus,
    } = req.body;

    // Get newly uploaded photos
    const newproductImg = req.files;
    const productImg = req.files;
    const arr = [];
    const existingImages = existingProduct.productImg;
 
    if (newproductImg) {
      for (const element of newproductImg) {
        const filePath = `uploads/cropperd_${element.originalname}`;
        const cropped = await sharp(element.path)
          .resize({ width: 500, height: 500, fit: 'cover' })
          .toFile(filePath);
        arr.push(filePath);
      }
    }

    const updatedProductImg = [...existingImages, ...arr];

    const updatedData = {
      productName,
      productDiscription,
      productCategory,
      productBrand,
      regularPrice,
      sellingPrice,
      productSize,
      productStock,
      productStatus,
      productImg: updatedProductImg,
    };
    const updatedProduct = await productCollection.findByIdAndUpdate(
      editId,
      updatedData,
      { new: true }
    );
    const successMessage = "Product updated successfully";
    res.redirect("/admin/product-list");
  } catch (error) {
    console.log(error);
    next(error);
  }
};


module.exports.blockProduct = async (req, res) => {
  try {
    Idproduct = req.params.productId;
    const newStatus = await productCollection.findById({ _id: Idproduct });
    const updatedStatus = await productCollection.updateOne(
      { _id: Idproduct },
      { $set: { productStatus: "Block" } }
    );
    res.redirect("/admin/product-list");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Unblock product
module.exports.unblockProduct = async (req, res) => {
  try {
    Idproduct = req.params.productId;
    const newStatus = await productCollection.findById({ _id: Idproduct });
    const updatedStatus = await productCollection.updateOne(
      { _id: Idproduct },
      { $set: { productStatus: "Unblock" } }
    );
    res.redirect("/admin/product-list");
  } catch (error) {
    console.error(error);
    next(error);
  }
};


module.exports.deleteImage = async (req, res) => {
  try {
    const productId = req.query.productId;
    const imagepath = req.query.image;

    console.log("Deleting Image:", imagepath);
    await productCollection.updateOne(
      { _id: productId },
      { $pull: { productImg: imagepath } }
    );
    const productdata = await productCollection.findOne({ _id: productId });
    const categorydata = await categoryCollection.find({});
    res.render("admin-editproduct", { productdata, categorydata });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
