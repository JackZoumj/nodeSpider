const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
	res.send("获取管理员信息");
});

router.get("/:id", (req, res) => {
	res.send("获取一个管理员信息");
});

router.post("/", (req, res) => {
	res.send("添加一个管理员信息");
});

router.delete("/:id", (req, res) => {
	res.send("删除一个管理员信息");
});

router.put("/:id", (req, res) => {
	res.send("修改一个管理员信息");
});

module.exports = router;
