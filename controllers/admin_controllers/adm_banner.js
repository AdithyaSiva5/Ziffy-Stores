const bannerCollection = require("../../models/banner_schema")

module.exports.getBanners = async(req,res)=>{
    try {
        const banners = await bannerCollection.find();
        res.render("admin-banners", { banners });
    } catch (error) {
        console.log(error)
        
    }
}
module.exports.getAddBanner = async (req, res) => {
  try {
    res.render("admin-banneradd");
  } catch (error) {
    console.error(error);
  }
};

module.exports.postAddBanner = async (req, res) => {
  try {
    const { title, subtitle, status, expiryDate } = req.body;
    if (req.file) {
      image = `uploads/banners/${req.file.filename}`;
    }
    await bannerCollection.create({
      title,
      subtitle,
      status,
      expiryDate,
      image,
    });
    console.log(image)
    res.redirect("/admin/banners");
  } catch (error) {
    console.error(error);
  }
};

module.exports.getEditBanner = async (req, res) => {
  try {
    const banner = await bannerCollection.findById(req.params.bannerId);
    res.render("admin-banneredit", { banner });
  } catch (error) {
    console.error(error);
  }
};

module.exports.postEditBanner = async (req, res) => {
  try {
    const { title, subtitle, status, expiryDate } = req.body;
    const banner = await bannerCollection.findById(req.params.bannerId);
    let image = banner.image;
    if (req.file) {
      image = `uploads/banners/${req.file.filename}`;
    }
    await bannerCollection.findByIdAndUpdate(req.params.bannerId, {
      title,
      subtitle,
      status,
      expiryDate,
      image,
    });

    res.redirect("/admin/banners");
  } catch (error) {
    console.error(error);
  }
};

module.exports.blockBanner = async (req, res) => {
  try {
    await bannerCollection.findByIdAndUpdate(req.params.bannerId, {
      status: "Inactive",
    });
    res.redirect("/admin/banners");
  } catch (error) {
    console.error(error);
  }
};

module.exports.unblockBanner = async (req, res) => {
  try {
    await bannerCollection.findByIdAndUpdate(req.params.bannerId, {
      status: "Active",
    });
    res.redirect("/admin/banners");
  } catch (error) {
    console.error(error);
  }
};
