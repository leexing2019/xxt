<template>
  <view class="add-medication-page">
    <!-- 选择添加方式 -->
    <view class="method-selection">
      <view class="section-title">
        <text class="h3-title">添加药品</text>
        <text class="section-hint">选择一种方式添加药品</text>
      </view>

      <view class="method-grid">
        <!-- 语音输入 - 主推 -->
        <view class="method-card primary" @click="selectMethod('voice')">
          <text class="method-icon-large">🎤</text>
          <text class="method-name-large">语音说药名</text>
          <text class="method-desc">说出药品名称，自动搜索</text>
        </view>

        <!-- 常用药品 -->
        <view class="method-card" @click="selectMethod('common')">
          <text class="method-icon">📋</text>
          <text class="method-name">常用药品</text>
          <text class="method-desc">高血压/糖尿病等常用药</text>
        </view>

        <!-- 拍照识别 -->
        <view class="method-card" @click="selectMethod('camera')">
          <text class="method-icon">📷</text>
          <text class="method-name">拍照识别</text>
          <text class="method-desc">拍摄药盒，适合新药</text>
        </view>

        <!-- 手写输入 -->
        <view class="method-card" @click="selectMethod('handwrite')">
          <text class="method-icon">✏️</text>
          <text class="method-name">手写输入</text>
          <text class="method-desc">手写药名，更准确</text>
        </view>
      </view>
    </view>
