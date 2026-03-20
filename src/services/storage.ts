import { supabase } from './supabase'

/**
 * 上传药品图片到 Supabase Storage
 * @param file - 要上传的文件
 * @param userId - 用户 ID
 * @returns 图片的公开访问 URL
 */
export async function uploadMedicationImage(file: File, userId: string): Promise<string> {
  // 生成唯一的文件名
  const fileName = `${userId}/medication_${Date.now()}_${Math.random().toString(36).slice(2)}`

  // 上传到 medication-images bucket
  const { data, error } = await supabase.storage
    .from('medication-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('上传图片失败:', error)
    throw new Error('图片上传失败：' + error.message)
  }

  // 获取公开访问 URL
  const { data: { publicUrl } } = supabase.storage
    .from('medication-images')
    .getPublicUrl(fileName)

  return publicUrl
}

/**
 * 上传用户头像到 Supabase Storage
 * @param file - 要上传的文件
 * @param userId - 用户 ID
 * @returns 头像的公开访问 URL
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileName = `${userId}/avatar_${Date.now()}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('上传头像失败:', error)
    throw new Error('头像上传失败：' + error.message)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  return publicUrl
}

/**
 * 删除 Storage 中的文件
 * @param bucket - bucket 名称
 * @param paths - 要删除的文件路径数组
 */
export async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    console.error('删除文件失败:', error)
    throw new Error('文件删除失败：' + error.message)
  }
}

/**
 * 从 URL 加载图片为 File 对象（用于编辑时回显）
 * @param url - 图片 URL
 * @returns File 对象
 */
export async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type })
}
