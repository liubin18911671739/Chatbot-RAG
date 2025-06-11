# 网络限制图标说明

由于无法直接创建图片文件，请手动添加以下图片到 `/images/` 目录：

## 需要的图片文件：

### 1. network-restriction.png
- 尺寸：120x120px
- 用途：访问拒绝页面的主图标
- 建议：可以使用网络禁止、WiFi禁用或类似的图标
- 可以从以下网站获取：
  - https://www.iconfinder.com/
  - https://icons8.com/
  - https://www.flaticon.com/

### 2. 或者使用Emoji替代
如果暂时没有图标，可以在访问拒绝页面的wxml文件中将：
```xml
<image class="restriction-icon" src="/images/network-restriction.png" mode="aspectFit"></image>
```
替换为：
```xml
<text class="restriction-emoji">🚫</text>
```

然后在对应的wxss文件中添加样式：
```css
.restriction-emoji {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  display: block;
}
```
