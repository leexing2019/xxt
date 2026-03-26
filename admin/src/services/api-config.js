/**
 * API 配置服务
 *
 * 从后端获取和保存 API 配置
 */
import { supabase } from './supabase';
const STORAGE_KEY = 'admin_api_config_cache';
// 从 Supabase 获取 API 配置
export async function getApiConfigFromBackend() {
    try {
        const { data, error } = await supabase
            .from('api_config')
            .select('*')
            .eq('id', 1)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                // 记录不存在，返回空配置
                return null;
            }
            throw error;
        }
        // 解密配置（实际生产中应该在服务端解密）
        const config = {
            baiduOcrApiKey: data?.baidu_ocr_api_key || '',
            baiduOcrSecretKey: data?.baidu_ocr_secret || '',
            baiduSpeechAppId: data?.baidu_speech_app_id || '',
            baiduSpeechApiKey: data?.baidu_speech_api_key || '',
            baiduSpeechSecretKey: data?.baidu_speech_secret || '',
            drugApiBaseUrl: data?.drug_api_base_url || '',
            drugApiKey: data?.drug_api_key || ''
        };
        // 缓存到本地
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return config;
    }
    catch (error) {
        console.error('获取 API 配置失败:', error);
        // 尝试从缓存读取
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                return JSON.parse(cached);
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
// 保存 API 配置到 Supabase
export async function saveApiConfigToBackend(config) {
    try {
        const { error } = await supabase
            .from('api_config')
            .upsert({
            id: 1,
            baidu_ocr_api_key: config.baiduOcrApiKey,
            baidu_ocr_secret: config.baiduOcrSecretKey,
            baidu_speech_app_id: config.baiduSpeechAppId,
            baidu_speech_api_key: config.baiduSpeechApiKey,
            baidu_speech_secret: config.baiduSpeechSecretKey,
            drug_api_base_url: config.drugApiBaseUrl || '',
            drug_api_key: config.drugApiKey || '',
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'id'
        });
        if (error)
            throw error;
        // 更新缓存
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return true;
    }
    catch (error) {
        console.error('保存 API 配置失败:', error);
        return false;
    }
}
// 测试百度 API 连接（通过 Edge Function 代理）
export async function testBaiduApiConnection(apiKey, secretKey) {
    try {
        // 获取 Supabase URL 和匿名密钥
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            return { success: false, message: 'Supabase 配置缺失' };
        }
        // 调用 Edge Function 测试连接
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/test-baidu-api`;
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ apiKey, secretKey })
        });
        const data = await response.json();
        if (data.success) {
            return { success: true, message: data.message };
        }
        else {
            return { success: false, message: data.message || '连接失败' };
        }
    }
    catch (error) {
        console.error('Edge Function 调用失败:', error);
        return { success: false, message: '网络错误：' + (error.message || '请检查网络连接') };
    }
}
