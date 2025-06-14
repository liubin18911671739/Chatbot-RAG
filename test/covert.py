#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修改 scenes.png 图像为 81x81 像素，确保文件大小不超过 40KB
"""

from PIL import Image
import os

def resize_and_optimize_image(input_path, output_path, target_size=(81, 81), max_size_kb=40):
    """
    调整图像大小并优化文件大小
    
    Args:
        input_path: 输入文件路径
        output_path: 输出文件路径
        target_size: 目标尺寸 (width, height)
        max_size_kb: 最大文件大小(KB)
    
    Returns:
        tuple: (成功标志, 最终文件大小KB)
    """
    
    try:
        # 打开原始图像
        original_img = Image.open(input_path)
        print(f"📷 原始图像尺寸: {original_img.size[0]}x{original_img.size[1]} 像素")
        print(f"📷 原始图像模式: {original_img.mode}")
        
        # 调整尺寸，使用高质量重采样
        resized_img = original_img.resize(target_size, Image.Resampling.LANCZOS)
        print(f"🔄 调整后尺寸: {resized_img.size[0]}x{resized_img.size[1]} 像素")
        
        # 如果是RGBA模式，先尝试保持透明度
        if resized_img.mode == 'RGBA':
            print("🎨 检测到透明通道，尝试保持透明度...")
            
            # 尝试不同的压缩级别
            compression_levels = [9, 6, 3, 1]
            
            for level in compression_levels:
                resized_img.save(output_path, 'PNG', optimize=True, compress_level=level)
                
                file_size_bytes = os.path.getsize(output_path)
                file_size_kb = file_size_bytes / 1024
                
                print(f"RGBA 压缩级别 {level}: {file_size_kb:.2f} KB")
                
                if file_size_kb <= max_size_kb:
                    print(f"✅ RGBA模式文件大小满足要求: {file_size_kb:.2f} KB <= {max_size_kb} KB")
                    return True, file_size_kb
            
            # 如果RGBA模式文件太大，转换为RGB
            print("⚠️  RGBA模式文件过大，转换为RGB模式...")
            
            # 创建白色背景
            rgb_img = Image.new('RGB', target_size, (255, 255, 255))
            if resized_img.mode == 'RGBA':
                rgb_img.paste(resized_img, mask=resized_img.split()[-1])  # 使用alpha通道作为mask
            else:
                rgb_img.paste(resized_img)
            
            resized_img = rgb_img
        
        # 如果不是RGB模式，转换为RGB
        if resized_img.mode != 'RGB':
            print(f"🔄 转换图像模式: {resized_img.mode} -> RGB")
            resized_img = resized_img.convert('RGB')
        
        # 尝试不同的压缩级别
        compression_levels = [9, 6, 3, 1]
        
        for level in compression_levels:
            resized_img.save(output_path, 'PNG', optimize=True, compress_level=level)
            
            file_size_bytes = os.path.getsize(output_path)
            file_size_kb = file_size_bytes / 1024
            
            print(f"RGB 压缩级别 {level}: {file_size_kb:.2f} KB")
            
            if file_size_kb <= max_size_kb:
                print(f"✅ RGB模式文件大小满足要求: {file_size_kb:.2f} KB <= {max_size_kb} KB")
                return True, file_size_kb
        
        # 如果还是太大，尝试降低色彩数量
        print("🎨 尝试减少颜色数量...")
        
        # 转换为P模式（256色调色板）
        quantized = resized_img.quantize(colors=128, method=Image.Resampling.LANCZOS)
        quantized = quantized.convert('RGB')
        
        for level in compression_levels:
            quantized.save(output_path, 'PNG', optimize=True, compress_level=level)
            
            file_size_bytes = os.path.getsize(output_path)
            file_size_kb = file_size_bytes / 1024
            
            print(f"量化后压缩级别 {level}: {file_size_kb:.2f} KB")
            
            if file_size_kb <= max_size_kb:
                print(f"✅ 量化后文件大小满足要求: {file_size_kb:.2f} KB <= {max_size_kb} KB")
                return True, file_size_kb
        
        # 进一步减少颜色
        print("🎨 进一步减少颜色数量...")
        quantized = resized_img.quantize(colors=64, method=Image.Resampling.LANCZOS)
        quantized = quantized.convert('RGB')
        
        for level in compression_levels:
            quantized.save(output_path, 'PNG', optimize=True, compress_level=level)
            
            file_size_bytes = os.path.getsize(output_path)
            file_size_kb = file_size_bytes / 1024
            
            print(f"64色量化后压缩级别 {level}: {file_size_kb:.2f} KB")
            
            if file_size_kb <= max_size_kb:
                print(f"✅ 64色量化后文件大小满足要求: {file_size_kb:.2f} KB <= {max_size_kb} KB")
                return True, file_size_kb
        
        print(f"⚠️  已应用最大压缩，最终大小: {file_size_kb:.2f} KB")
        return False, file_size_kb
        
    except Exception as e:
        print(f"❌ 处理图像时出错: {str(e)}")
        return False, 0

def main():
    """主函数"""
    print("🎨 修改 scenes.png 图像为 81x81 像素")
    print("📋 要求: 尺寸 81x81 像素，文件大小 ≤ 40KB")
    print("=" * 60)
    
    # 输入文件路径
    input_path = "miniprogram/images/ai-avatar.png"
    
    # 检查输入文件是否存在
    if not os.path.exists(input_path):
        print(f"❌ 找不到输入文件: {input_path}")
        print("请确保 scenes.png 文件存在于当前目录中")
        return
    
    # 获取原始文件信息
    original_size_bytes = os.path.getsize(input_path)
    original_size_kb = original_size_bytes / 1024
    print(f"📊 原始文件大小: {original_size_kb:.2f} KB")
    
    # 输出文件列表
    output_files = [
        "ai-avatar.png",
        "miniprogram/images/ai-avatar.png"
    ]
    
    for output_path in output_files:
        # 确保目录存在
        directory = os.path.dirname(output_path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        
        print(f"\n💾 处理并保存: {output_path}")
        success, final_size = resize_and_optimize_image(
            input_path, output_path, 
            target_size=(81, 81), 
            max_size_kb=40
        )
        
        if success:
            print(f"✅ {output_path} 创建成功")
        else:
            print(f"⚠️ {output_path} 文件大小超限，但已保存最优版本")
        
        # 最终验证
        if os.path.exists(output_path):
            final_img = Image.open(output_path)
            final_size_bytes = os.path.getsize(output_path)
            final_size_kb = final_size_bytes / 1024
            
            print(f"📊 最终结果:")
            print(f"   📏 尺寸: {final_img.size[0]}x{final_img.size[1]} 像素")
            print(f"   💾 大小: {final_size_kb:.2f} KB")
            print(f"   🎯 符合要求: {'✅' if final_size_kb <= 40 and final_img.size == (81, 81) else '❌'}")
    
    print("\n" + "=" * 60)
    print("🎉 scenes.png 图像处理完成!")
    print(f"📁 输出文件:")
    for path in output_files:
        if os.path.exists(path):
            size = os.path.getsize(path) / 1024
            print(f"   {path} ({size:.2f} KB)")
    
    print(f"\n📝 处理说明:")
    print(f"   🔄 使用高质量LANCZOS重采样算法调整尺寸")
    print(f"   🎨 自动检测并处理透明通道")
    print(f"   💾 应用多级压缩优化文件大小")
    print(f"   🌈 必要时减少颜色数量以满足大小要求")

if __name__ == "__main__":
    main()