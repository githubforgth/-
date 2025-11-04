// ==UserScript==
// @name         自动播放视频并跳转下一单元（二倍速）牛牛版本
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  页面加载时自动触发，自动播放视频，设置倍速，处理暂停和完成后跳转
// @author       You
// @match        https://sdauyjs.yuketang.cn/pro/lms/CTPaC7t4Fdh/28443593/video/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let checkVideoInterval;
    let videoProcessed = false;

    function initVideoHandler() {
        // 如果已经处理过视频，不再重复处理
        if (videoProcessed) return;

        const video = document.querySelector('video.xt_video_player');

        if (video) {
            videoProcessed = true;
            clearInterval(checkVideoInterval);

            console.log("找到视频元素，开始初始化...");

            // 设置视频播放速度为2倍
            video.playbackRate = 2.0;
            console.log("视频播放速度设置为2倍");

            // 尝试自动播放
            const playVideo = async () => {
                try {
                    // 先确保视频有声音但音量适中
                    video.volume = 0.5;
                    await video.play();
                    console.log("视频自动播放成功");
                } catch (error) {
                    console.log('自动播放失败，可能需要用户交互:', error);
                    // 如果自动播放失败，尝试点击播放按钮
                    const playButton = document.querySelector('.xt_video_player_play_btn, .vjs-play-control');
                    if (playButton) {
                        playButton.click();
                        console.log("通过点击播放按钮启动视频");
                    }
                }
            };

            // 设置倍速
            const setPlaybackSpeed = () => {
                // 方法1: 直接设置video属性
                video.playbackRate = 2.0;

                // 方法2: 尝试点击倍速按钮选择2倍速
                setTimeout(() => {
                    const speedButton = document.querySelector('.xt_video_player_speed, .speed-select, .vjs-playback-rate');
                    if (speedButton) {
                        speedButton.click();

                        // 等待菜单展开后选择2倍速
                        setTimeout(() => {
                            const speedOption = document.querySelector('[data-speed="2"], [data-value="2"], .speed-2');
                            if (speedOption) {
                                speedOption.click();
                                console.log("通过倍速菜单设置2倍速");
                            }
                        }, 500);
                    }
                }, 1000);
            };

            // 监听视频暂停事件（排除正常结束的情况）
            video.addEventListener('pause', function() {
                if (!video.ended) {
                    console.log("视频意外暂停，自动继续播放");
                    video.play().catch(e => console.log('继续播放失败:', e));
                }
            });

            // 监听视频播放结束事件
            video.addEventListener('ended', function() {
                console.log("视频播放结束，准备跳转至下一个单元");
                goToNextUnit();
            });

            // 监听加载完成事件
            video.addEventListener('loadeddata', function() {
                setPlaybackSpeed();
                playVideo();
            });

            // 如果视频已经可以播放，立即执行
            if (video.readyState >= 3) {
                setPlaybackSpeed();
                playVideo();
            }

        } else {
            console.log("视频元素尚未加载，继续等待...");
        }
    }

    function goToNextUnit() {
        // 尝试多种可能的选择器
        const nextSelectors = [
            '.next-unit-button',
            '.next-btn',
            '.next-unit',
            '.nav-next',
            '[title*="下一"]',
            'button:contains("下一")'
        ];

        let nextButton = null;

        for (const selector of nextSelectors) {
            nextButton = document.querySelector(selector);
            if (nextButton) {
                console.log(`找到下一单元按钮: ${selector}`);
                break;
            }
        }

        if (nextButton) {
            nextButton.click();
            console.log("已点击下一单元按钮");
        } else {
            console.log("未找到下一单元按钮");
            // 可以尝试模拟键盘右键（下一页）
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                code: 'ArrowRight',
                keyCode: 39
            }));
        }
    }

    // 页面加载完成后开始检查
    window.addEventListener('load', function() {
        console.log("页面加载完成，开始检查视频元素...");

        // 立即检查一次
        initVideoHandler();

        // 设置定时检查
        checkVideoInterval = setInterval(initVideoHandler, 2000);

        // 10秒后停止检查，避免无限循环
        setTimeout(() => {
            if (checkVideoInterval) {
                clearInterval(checkVideoInterval);
                if (!videoProcessed) {
                    console.log("10秒内未找到视频元素，停止检查");
                }
            }
        }, 10000);
    });

    // 监听URL变化（单页应用）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            videoProcessed = false;
            setTimeout(initVideoHandler, 1000);
        }
    }).observe(document, {subtree: true, childList: true});

})();