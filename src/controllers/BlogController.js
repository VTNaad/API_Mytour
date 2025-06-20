const Blog = require("../models/Blog");
const Comment = require("../models/Comment");

class BlogController {
  async create(req, res) {
    const blog = new Blog(req.body);
    await blog.save();
    res.json(blog);
  }
  async update(req, res) {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(blog);
  }
  async delete(req, res) {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted" });
  }
  async comment(req, res) {
    const comment = new Comment({ blogId: req.params.id, ...req.body });
    await comment.save();
    res.json(comment);
  }
  async getComments(req, res) {
    const comments = await Comment.find({ blogId: req.params.id });
    res.json(comments);
  }
}
module.exports = new BlogController();
