import { supabase } from './supabase';
/**
 * 获取所有用户的依从性统计
 * @param date 目标日期，格式 YYYY-MM-DD
 */
export async function getAllUserComplianceStats(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
        // 查询今日数据
        const { data: todayData, error: todayError } = await supabase
            .rpc('get_user_compliance_stats', {
            target_date: targetDate,
            days_range: 1
        });
        if (todayError) {
            console.error('获取今日依从性数据失败:', todayError);
            return [];
        }
        // 查询 7 日数据
        const { data: weekData, error: weekError } = await supabase
            .rpc('get_user_compliance_stats', {
            target_date: targetDate,
            days_range: 7
        });
        if (weekError) {
            console.error('获取 7 日依从性数据失败:', weekError);
            return [];
        }
        // 查询 30 日数据
        const { data: monthData, error: monthError } = await supabase
            .rpc('get_user_compliance_stats', {
            target_date: targetDate,
            days_range: 30
        });
        if (monthError) {
            console.error('获取 30 日依从性数据失败:', monthError);
            return [];
        }
        // 合并数据
        return (todayData || []).map((item) => ({
            user_id: item.user_id,
            username: item.username,
            phone: item.phone,
            today_compliance: Number(item.compliance_rate) || 0,
            week_compliance: Number(weekData?.find((w) => w.user_id === item.user_id)?.compliance_rate) || 0,
            month_compliance: Number(monthData?.find((m) => m.user_id === item.user_id)?.compliance_rate) || 0
        }));
    }
    catch (error) {
        console.error('获取依从性数据异常:', error);
        return [];
    }
}
/**
 * 获取用户指定日期的服药记录
 * @param userId 用户 ID
 * @param date 日期，格式 YYYY-MM-DD
 */
export async function getUserDailyLogs(userId, date) {
    try {
        const { data, error } = await supabase
            .from('medication_logs')
            .select(`
        id,
        scheduled_time,
        taken_time,
        status,
        medication:medication_id (
          id,
          name,
          form,
          color,
          shape
        )
      `)
            .eq('user_id', userId)
            .gte('scheduled_time', `${date}T00:00:00.000Z`)
            .lt('scheduled_time', `${date}T23:59:59.999Z`)
            .order('scheduled_time', { ascending: true });
        if (error) {
            console.error('获取服药记录失败:', error);
            return [];
        }
        return (data || []).map((log) => ({
            id: log.id,
            scheduled_time: log.scheduled_time,
            taken_time: log.taken_time,
            status: log.status,
            medication_name: log.medication?.name || '未知药品',
            medication_form: log.medication?.form || 'unknown',
            medication_color: log.medication?.color,
            medication_shape: log.medication?.shape
        }));
    }
    catch (error) {
        console.error('获取服药记录异常:', error);
        return [];
    }
}
/**
 * 获取用户月度依从率（用于热力图）
 * @param userId 用户 ID
 * @param year 年份
 * @param month 月份（1-12）
 */
export async function getUserMonthlyCompliance(userId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    try {
        const { data, error } = await supabase
            .from('user_daily_compliance')
            .select('log_date, compliance_rate')
            .eq('user_id', userId)
            .gte('log_date', startDate)
            .lte('log_date', endDate);
        if (error) {
            console.error('获取月度依从性数据失败:', error);
            return [];
        }
        return (data || []).map((item) => ({
            date: item.log_date,
            rate: Number(item.compliance_rate) || 0
        }));
    }
    catch (error) {
        console.error('获取月度依从性数据异常:', error);
        return [];
    }
}
/**
 * 获取用户平均依从率（用于 Dashboard 卡片）
 */
export async function getAverageComplianceRate(days = 7) {
    const today = new Date().toISOString().split('T')[0];
    try {
        const { data, error } = await supabase
            .rpc('get_user_compliance_stats', {
            target_date: today,
            days_range: days
        });
        if (error) {
            console.error('获取平均依从率失败:', error);
            return 0;
        }
        const validRates = (data || [])
            .map((item) => Number(item.compliance_rate) || 0)
            .filter((rate) => rate > 0);
        if (validRates.length === 0)
            return 0;
        const avg = validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length;
        return Math.round(avg * 10) / 10;
    }
    catch (error) {
        console.error('获取平均依从率异常:', error);
        return 0;
    }
}
