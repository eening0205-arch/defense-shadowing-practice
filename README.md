# 答辩稿俄语跟读练习

这是一个可以直接放到 GitHub Pages 的静态网页。包含：

- `index.html`：网页入口
- `styles.css`：页面样式，已适配手机
- `app.js`：播放、切换段落、标记已练、录音功能
- `segments.js` 和 `data/segments.json`：俄语和中文文本
- `audio/`：31 段俄语音频
- `.nojekyll`：让 GitHub Pages 按普通静态文件发布

## 上传到 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `defense-shadowing`。
2. 把本文件夹里的所有内容上传到仓库根目录。注意是上传这些文件本身，不是再套一层文件夹。
3. 打开仓库 `Settings` -> `Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`，保存。
6. 等一两分钟后，用 GitHub 显示的 Pages 地址打开即可。

手机访问时，播放音频可以直接用。录音功能需要 HTTPS，GitHub Pages 默认就是 HTTPS；如果浏览器询问麦克风权限，要选择允许。
