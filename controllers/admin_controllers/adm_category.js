const mongoose = require("mongoose");
const multer = require("multer");


const categoryCollection = require("../../models/category");
const productCollection = require("../../models/product");

// render category page with data
module.exports.getCategory = async (req, res) => {
  try {
    const categories = await categoryCollection.find();
    res.render("admin-categorylist", { categories });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
module.exports.postCategory = async (req, res) => {
  try {
    const catgName = req.body.catgName;
    const categorydata = await categoryCollection.findOne({
      catgName: catgName,
    });
    if (categorydata) {
      res
        .status(409)
        .json({ success: false, message: "Category already exists" });
    } else {
      await categoryCollection.create({
        catgName: catgName,
        catgDiscription: req.body.catgDiscription,
        categoryStatus: "Unblock",
      });
      const categories = await categoryCollection.find();
      res
        .status(200)
        .json({
          success: true,
          message: "Category added successfully",
          categories,
        });
        
    }
  } catch (error) {
    console.error(error);
    next(error);
    
  }
};

// render edit category data page
module.exports.editCategory = async (req, res) => {
  const category = req.params.categoryId;
  const categorydata = await categoryCollection.findById({ _id: category });
  res.render("admin-editcategory", { categorydata });
};

// update category
module.exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const catagory = await categoryCollection.findById(categoryId);
    const oldcate = req.body.catgName;
    const ifexist = await categoryCollection.findOne({
      catgName : oldcate,
      _id: { $ne: categoryId },
    });
    if (ifexist) {
      res.status(200).json({ error: "Name With Same Category Exist" });
    } else {
      catagory.catgName = req.body.catgName;
      catagory.catgDiscription = req.body.catgDiscription;
      await catagory.save();
      res.status(200).json({ message: "Data Updated" });
    }
    // res.redirect("/admin/category-list");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// delete category
module.exports.deleteCategory = async (req, res) => {
  try {
    const catagoryId = req.params.categoryId;
    const result = await categoryCollection.deleteOne({ _id: catagoryId });

    if (result.deletedCount === 1) {
      res.redirect("/admin/category-list");
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
}; 

// block category
module.exports.blockCategory = async (req, res) => {
  try {
    Idcategory = req.params.categoryId;
    const updatedStatus = await categoryCollection.updateOne(
      { _id: Idcategory  }, 
      { $set: { categoryStatus: "Block" } }
    );
    res.redirect("/admin/category-list");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// unblock category
module.exports.unblockCategory = async (req, res) => {
  try {
    Idcategory = req.params.categoryId;
    const newStatus = await categoryCollection.findById({ _id: Idcategory });
    const updatedStatus = await categoryCollection.updateOne(
      { _id: Idcategory },
      { $set: { categoryStatus: "Unblock" } }
    );
    res.redirect("/admin/category-list");
  } catch (error) {
    console.error(error);
    next(error);
  }
};
