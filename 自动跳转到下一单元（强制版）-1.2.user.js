// ==UserScript==
// @name         自动跳转到下一单元（强制版）
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description 强制自动跳转，确保可靠工作
// @author       You
// @match        https://sdauyjs.yuketang.cn/pro/lms/CTPaC7t4Fdh/28443593/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    if (window.hasRunAutoNextUnit) return;
    window.hasRunAutoNextUnit = true;

    console.log("自动跳转脚本加载 - 强制版");

    let currentUnitId = null;
    let unitType = null;

    // 初始化
    function init() {
        const url = window.location.href;
        console.log("初始化，当前URL:", url);

        // 解析当前单元信息
        parseCurrentUnit(url);

        // 根据单元类型设置自动跳转
        if (unitType === 'video') {
            setupVideoAutoNext();
        } else if (unitType === 'graph') {
            setupGraphAutoNext();
        } else {
            // 未知类型，使用通用跳转
            setupGenericAutoNext();
        }
    }

    // 解析当前单元信息
    function parseCurrentUnit(url) {
        const match = url.match(/\/(video|graph)\/(\d+)/);
        if (match) {
            unitType = match[1];
            currentUnitId = parseInt(match[2]);
            console.log(`解析结果: 类型=${unitType}, ID=${currentUnitId}`);
        } else {
            console.log("无法解析URL，使用默认设置");
            unitType = 'unknown';
        }
    }

    // 设置视频单元自动跳转
    function setupVideoAutoNext() {
        console.log("设置视频单元自动跳转");

        const video = document.querySelector('video.xt_video_player');
        if (video) {
            console.log("找到视频元素，设置监听");

            // 监听时间更新，检测是否接近结束
            video.addEventListener('timeupdate', function() {
                const timeRemaining = video.duration - video.currentTime;
                if (timeRemaining < 5 && timeRemaining > 0) {
                    console.log(`视频即将结束，剩余${timeRemaining.toFixed(1)}秒`);
                    // 提前准备跳转
                    if (timeRemaining < 3) {
                        video.removeEventListener('timeupdate', arguments.callee);
                        scheduleAutoNext(1000);
                    }
                }
            });

            // 监听结束事件
            video.addEventListener('ended', function() {
                console.log("视频播放结束");
                scheduleAutoNext(500);
            });

            // 如果视频已经结束，直接跳转
            if (video.ended) {
                console.log("视频已结束，立即跳转");
                scheduleAutoNext(500);
            }

            // 备用：5分钟后强制跳转
            setTimeout(() => {
                console.log("视频备用跳转触发");
                forceNextUnit();
            }, 300000);
        } else {
            console.log("未找到视频元素，使用通用跳转");
            setupGenericAutoNext();
        }
    }

    // 设置图文单元自动跳转
    function setupGraphAutoNext() {
        console.log("设置图文单元自动跳转");

        // 方法1: 检测已读状态
        const checkReadStatus = setInterval(() => {
            const readElement = document.querySelector('.el-tooltip.item.f12.color-9b');
            if (readElement && readElement.textContent.includes('已读')) {
                console.log("检测到已读状态");
                clearInterval(checkReadStatus);
                scheduleAutoNext(1000);
            }
        }, 2000);

        // 方法2: 10秒后自动跳转
        setTimeout(() => {
            console.log("图文单元定时跳转");
            clearInterval(checkReadStatus);
            forceNextUnit();
        }, 10000);

        // 方法3: 滚动检测
        const content = document.querySelector('#content-wrapper');
        if (content) {
            content.addEventListener('scroll', function() {
                const isBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 10;
                if (isBottom) {
                    console.log("检测到滚动到底部");
                    clearInterval(checkReadStatus);
                    scheduleAutoNext(500);
                }
            });
        }
    }

    // 设置通用自动跳转
    function setupGenericAutoNext() {
        console.log("设置通用自动跳转");

        // 10秒后自动跳转
        setTimeout(() => {
            forceNextUnit();
        }, 10000);
    }

    // 安排自动跳转
    function scheduleAutoNext(delay = 0) {
        console.log(`安排${delay}ms后自动跳转`);
        setTimeout(() => {
            forceNextUnit();
        }, delay);
    }

    // 强制跳转到下一单元
    function forceNextUnit() {
        console.log("执行强制跳转");

        // 先尝试按钮点击
        const nextButton = document.querySelector('.btn-next');
        if (nextButton) {
            console.log("找到下一单元按钮，尝试点击");
            nextButton.click();

            // 给点击操作一些时间生效
            setTimeout(() => {
                // 如果还在同一页面，尝试URL跳转
                if (window.location.href.includes(`/${currentUnitId}`)) {
                    console.log("按钮点击可能未生效，尝试URL跳转");
                    navigateByUrl();
                }
            }, 2000);
        } else {
            // 直接使用URL跳转
            navigateByUrl();
        }
    }

    // 通过URL导航
    function navigateByUrl() {
        if (!currentUnitId) {
            parseCurrentUnit(window.location.href);
        }

        if (currentUnitId && unitType) {
            const nextId = currentUnitId + 1;
            const currentUrl = window.location.href;
            const nextUrl = currentUrl.replace(/\/(video|graph)\/\d+/, `/${unitType}/${nextId}`);

            console.log(`通过URL跳转到: ${nextUrl}`);
            window.location.href = nextUrl;
        } else {
            console.log("无法确定下一个URL，刷新页面重试");
            window.location.reload();
        }
    }

    // 页面加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 2000);
        });
    } else {
        setTimeout(init, 2000);
    }

    // 监听URL变化
    let lastUrl = location.href;
    const observer = new MutationObserver(function() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log("URL变化，重新初始化");
            setTimeout(init, 1000);
        }
    });
    observer.observe(document, { subtree: true, childList: true });

    // 全局函数
    window.manualNext = function() {
        console.log("手动触发跳转");
        forceNextUnit();
    };

    window.forceNext = function() {
        console.log("强制跳转");
        navigateByUrl();
    };

    window.getScriptStatus = function() {
        return {
            currentUrl: window.location.href,
            unitType: unitType,
            unitId: currentUnitId,
            nextButton: !!document.querySelector('.btn-next')
        };
    };

    // 调试函数：显示当前页面所有可能的下一个按钮
    window.showNextButtons = function() {
        const buttons = document.querySelectorAll('button, span, a');
        const nextButtons = [];

        buttons.forEach(btn => {
            const text = btn.textContent.trim();
            if (text.includes('下一单元') || text.includes('下一节') ||
                text.includes('下一个') || btn.classList.contains('btn-next')) {
                nextButtons.push({
                    element: btn,
                    text: text,
                    classes: btn.className,
                    tag: btn.tagName
                });
            }
        });

        console.log("找到的下一个按钮:", nextButtons);
        return nextButtons;
    };

    console.log("自动跳转脚本加载完成");

})();