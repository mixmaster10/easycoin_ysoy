import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import Loader from 'react-loader-spinner';
import { withRouter } from 'react-router-dom';
import { myConfig } from '../../config.js';
import BuyEasy from './../BuyEasy';
import BuyHpEasy from './BuyHpEasy.js';
import Utils from '../../utils';
import logo from '../../assets/logo-.svg';
import jackpot from '../../assets/jackpot_.png';
import jackpotWhite from '../../assets/jackpot_white.png';
import './Dashboard.scss';


class Dashboard extends React.Component {
    constructor(props) {
        super(props);

        let matrix = {
            id: 0,
            owner: '',
            referralsCnt: 0,
            matrixReferrer: 0,
            directReferrer: '',
            cycles: 0,
            bunchCycles: 0,
            referrals: [{ id: 0, type: 'other' }, { id: 0, type: 'other' }, { id: 0, type: 'other' }, { id: 0, type: 'other' }]
        }

        this.state = {
            loader: false,
            isRegistered: false,

            useToken: true,
            userId: 0,
            address: '',
            viewerAddress: '',
            referrer: 0,
            matricesCnt: 0,
            lastMatrix: 0,
            hpeasyCooldownTime: 0,
            hpeasyCooldownNum: 0,
            directReferrals: 0,
            sponsorId: 0,

            matrixEarningEth: 0,
            matrixEarningUsd: 0,
            hpEarningEth: 0,
            hpEarningUsd: 0,
            currentMatrix: matrix,
            referMatrixOwnerId: '',
            matrixIndex: 0,
            isMatrixOfCurrentUser: true,
            totalCycles: 0,
            metrixEarning: 0,
            lastUserMatrixId: 0,

            level1: 0,
            level2: 0,
            level3: 0,
            level4: 0,
            network: 0,
            directReferral1: 0,
            directReferral2: 0,
            directReferral3: 0,
            directReferral4: 0,

            userMatricesIds: [],
            transactions: [],
            matrixNetworkInfos: {},
            matrices: [],
            inactiveMatrices: [],

            totalUsers: 0,
            totalHPEasys: 0,
            lastHpEasyId: 0,
            skippedHpEasys: 0,
            bunchCyclesLimit: 0,

            fetchMatrixInfo: false,
            pageIsReady: false,

            jackpotLoad: [],
            isJackpotInfoBlock: false,
            jackpotQueue: null,

            easyAccountBalance: -1,
            easyBalance: -1,
            PURCHASE_COST_ETH: 0,
            PURCHASE_COST_EASY: 0,
            PURCHASE_COST_EASY_ETH_EQUIVALENT: 0,
            ETH_TO_EASY: 0,
            ETH_TO_USD: 0
        };


        if (typeof this.props !== 'undefined' && typeof this.props.match !== 'undefined' && typeof this.props.match.params !== 'undefined') {
            if (typeof this.props.match.params.id !== 'undefined')
                this.state.userId = this.props.match.params.id;
        } else {
            this.state.userId = 0;
        }

        this.onLoaderChange = this.onLoaderChange.bind(this);
        this.handleJoinJackpot = this.handleJoinJackpot.bind(this);
        this.handleShowJackpotParticipants = this.handleShowJackpotParticipants.bind(this);

    }

    // #region Component mount / unmount
    async componentDidMount() {
        await Utils.setWeb3(window);

        this.setState({ pageIsReady: true });
        this.initData();
    }
    // #endregion

    async initData() {
        //this.getRegistrationCostChangeEvents();
        this.initEthToUsdtExchageRate();
        this.initEthToEasyExchangeRate();
        this.initPurchaseCosts();
        this.initDashboardGeneralInfo();
        this.getUseToken();
        let user = null;

        if (this.state.userId === 0) {
            let currentUserAddress = await Utils.getCurrentUserAddress();
            user = await Utils.getCleanUser(currentUserAddress);
            if (user === null) return;
            this.setState({ userId: user.userId });
        }

        await this.initUserGeneralInfo(user);
        this.initEasyBalance();
        this.initPaymentEvents();
        this.initMatricesInfo();
    }

    // async getRegistrationCostChangeEvents() {
    //     console.log("Get reg eventsss");
    //     let reg = await Utils.getRegistrationCostChangeEvents(); 
    //     console.log(reg);
    // }

    // #region Dashboard General Info
    async initEthToUsdtExchageRate() {
        await fetch("https://api.binance.com/api/v3/avgPrice?symbol=ETHUSDT")
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        ETH_TO_USD: parseFloat(result.price)
                    });
                },
                (error) => {
                    console.error("Can't get exchange rate from Binance, use default value instead");
                    this.setState({
                        ETH_TO_USD: myConfig.ETH_TO_USD
                    });
                });
    }

    async initEthToEasyExchangeRate() {
        let rate = await Utils.getExchangeRate();

        if (rate !== null) {
            this.setState({ ETH_TO_EASY: rate });
        }
    }

    async getUseToken() {
        let useToken = await Utils.getUseToken();
        if (useToken === null) return;
        this.setState({ useToken: useToken });
    }

    async initEasyBalance() {
        let easyAccountBalance = await Utils.getEasyBalanceByUser(this.state.address);
        if (easyAccountBalance === null) return;
        this.setState({ easyAccountBalance: easyAccountBalance });

        if (this.state.isRegistered) {
            this.setState({ easyBalance: easyAccountBalance });
        } else {
            let easyBalance = await Utils.getEasyBalanceByUser();
            if (easyBalance === null) return;
            this.setState({ easyBalance: easyBalance });
        }
    }

    async initPurchaseCosts() {
        let purchaseCostEth = await Utils.getRegistrationCost();
        if (purchaseCostEth === null) return;
        this.setState({ PURCHASE_COST_ETH: purchaseCostEth });

        let purchaseCostEasyInEthEquivalent = await Utils.getRegistrationCostEasyInEthEquivalent(purchaseCostEth, this.state.ETH_TO_EASY);
        this.setState({ PURCHASE_COST_EASY: purchaseCostEth });
        this.setState({ PURCHASE_COST_EASY_ETH_EQUIVALENT: purchaseCostEasyInEthEquivalent });
    }

    async initDashboardGeneralInfo() {
        this.getTotalUsers();
        this.getTotalHpEasys();
        this.getSkippedHpEasys();
        this.getBunchCyclesLimit();
    }

    async getTotalUsers() {
        let totalUsers = await Utils.getTotalUsers();
        if (totalUsers === null) return;
        this.setState({ totalUsers: totalUsers });
    }

    async getTotalHpEasys() {
        let totalHPEasys = await Utils.getTotalHpEasys();
        if (totalHPEasys === null) return;
        this.setState({ totalHPEasys: totalHPEasys / 2 - this.state.skippedHpEasys });
    }

    async getSkippedHpEasys() {
        let skippedHpEasys = await Utils.getSkippedHpsOffset();
        if (skippedHpEasys === null) return;
        this.setState({ skippedHpEasys: skippedHpEasys });
        if (this.state.totalHPEasys > 0) {
            this.setState({ totalHPEasys: this.state.totalHPEasys - this.state.skippedHpEasys });
        }
    }

    async getBunchCyclesLimit() {
        let bunchCyclesLimit = await Utils.getBunchCyclesLimit();
        this.setState({ bunchCyclesLimit: bunchCyclesLimit });
    }
    // #endregion


    // #region User General Info
    async initUserGeneralInfo(user) {
        this.setState({ viewerAddress: Utils.getCurrentUserAddress() });
        if (user === null) {
            user = await Utils.getUserByIdClean(this.state.userId);
        }

        if (user === null) {
            Swal.fire({
                title: 'Connection problem',
                icon: 'error',
                html: "<p>Sorry, can't connect to ETHEREUM network.</p> <p>Please connect your Web3 provider <br><i>(<a href='" + myConfig.METAMASK_URL + "' target='_blank' rel='noopener noreferrer'>MetaMask</a> or other wallets that support online operations)</i></p>"
            })
            return;
        }

        let currentUserAddress = Utils.getCurrentUserAddress();

        if (currentUserAddress === user.address) {
            console.log("User is registered");
            this.setState({ isRegistered: true });
        }

        this.setState({ userId: user.userId });
        this.setState({ address: user.address });
        this.setState({ referrer: user.referrer });
        this.setState({ matricesCnt: user.matricesCnt });
        this.setState({ lastMatrix: user.lastMatrix });
        this.setState({ hpeasyCooldownTime: user.hpeasyCooldownTime });
        this.setState({ hpeasyCooldownNum: user.hpeasyCooldownNum });
        this.setState({ directReferrals: user.directReferrals });

        if (this.state.fetchMatrixInfo) {
            this.initMatricesInfo();
        }

        this.getSponsorId(user.referrer);
    }

    async getSponsorId(sponsorAddress) {
        let sponsor = await Utils.getCleanUser(sponsorAddress);
        if (sponsor != null) {
            this.setState({ sponsorId: sponsor.userId });
        }
    }
    // #endregion


    // #region Matrices Info
    async initMatricesInfo() {
        if (await this.getUserMatricesIdsList()) {
            this.getMatrixInfo(this.state.userMatricesIds[0], this.areMatricesActive);
            this.getMatrixNetworkInfo(this.state.userMatricesIds[0]);

            this.setState({ lastUserMatrixId: this.state.userMatricesIds[0] });
        }
    }

    async getUserMatricesIdsList() {
        if (this.state.userId === 0) {
            this.setState({ fetchMatrixInfo: true });
            console.log("Will get matrix info after user id is ready");
            return false;
        } else {
            this.setState({ fetchMatrixInfo: false });
        }

        let userMatricesIds = await Utils.getUserMatrixIds(this.state.userId);
        this.setState({ userMatricesIds: userMatricesIds });

        return true;
    }

    async getMatrixInfo(matrixId, callback) {
        let matrix;
        if (typeof matrixId === 'undefined') return;

        if (typeof this.state.matrices[matrixId] === 'undefined') {
            matrix = await Utils.getCleanMatrix(matrixId);
            if (matrix === null) return;

            let matrixReferrals = await Utils.getMatrixReferrers(matrixId);

            let allUserMatrices = this.state.userMatricesIds.includes(matrix.id) ?
                this.state.userMatricesIds : [];

            let referralsWithTypes = this.getReferralType(matrixReferrals, allUserMatrices);

            matrix.referrals = referralsWithTypes;
            let matrices = this.state.matrices;
            matrices[matrixId] = matrix;
            this.setState({ matrices: matrices });
        } else {
            matrix = this.state.matrices[matrixId];
        }

        let referMatrixOwnerId = await this.getMatrixOwnerId(matrix.matrixReferrer);

        this.setState({ referMatrixOwnerId: referMatrixOwnerId });
        this.setState({ currentMatrix: matrix });

        if (callback) {
            callback = callback.bind(this);
            callback();
        }
    }

    async getMatrixOwnerId(matrixId) {
        let matrix;
        let fromState = false;

        if (typeof matrixId === 'undefined') return '';

        if (typeof this.state.matrices[matrixId] === 'undefined') {
            matrix = await Utils.getCleanMatrix(matrixId);
            if (matrix === null) return '';
        } else {
            matrix = this.state.matrices[matrixId];
            fromState = true;
        }

        if (typeof matrix.ownerId === 'undefined') {
            let matrixOwner = await Utils.getCleanUser(matrix.owner);
            if (matrixOwner === null) return '';
            matrix.ownerId = matrixOwner.userId;

            if (fromState) {
                let matrices = this.state.matrices;
                matrices[matrix.id] = matrix;
                this.setState({ matrices: matrices });
            }
        }

        return matrix.ownerId;
    }

    async getMatrixNetworkInfo(matrixId) {
        let matrixNetworkInfo = {};

        if (typeof this.state.matrixNetworkInfos[matrixId] === 'undefined') {
            let referralsTree = { id: matrixId, parentId: null, children: [] };
            await this.buildNodeBranch(referralsTree, 0);
            matrixNetworkInfo = this.calculateNetwork(referralsTree);

            let matrixNetworkInfos = this.state.matrixNetworkInfos;
            matrixNetworkInfos[matrixId] = matrixNetworkInfo;
            this.setState({ matrixNetworkInfos: matrixNetworkInfos });
        } else {
            //console.log("Get network info for matrix id " + matrixId + " from state");
            matrixNetworkInfo = this.state.matrixNetworkInfos[matrixId];
        }

        this.setState({ level1: matrixNetworkInfo.level1 });
        this.setState({ level2: matrixNetworkInfo.level2 });
        this.setState({ level3: matrixNetworkInfo.level3 });
        this.setState({ level4: matrixNetworkInfo.level4 });
        this.setState({ network: matrixNetworkInfo.network });
    }

    async buildNodeBranch(node, treeDebth) {
        treeDebth++;
        if (treeDebth > 4) {
            return;
        }

        let matrixId = node.id;

        let matrixReferrals = await Utils.getMatrixReferrers(matrixId);

        for (let i = 0; i < matrixReferrals.length; i++) {
            let childNode = {
                id: matrixReferrals[i],
                parentId: matrixId,
                children: []
            }

            await this.buildNodeBranch(childNode, treeDebth);

            node.children.push(childNode);
        }
    }

    calculateNetwork(referralsTree) {
        let level1 = 0,
            level2 = 0,
            level3 = 0,
            level4 = 0;

        level1 = referralsTree.children.length;

        referralsTree.children.forEach(elementLevel1 => {
            level2 += elementLevel1.children.length;

            elementLevel1.children.forEach(elementLevel2 => {
                level3 += elementLevel2.children.length;

                elementLevel2.children.forEach(elementLevel3 => {
                    level4 += elementLevel3.children.length;
                });
            });
        });

        if (level1 > 4) level1 = 4;
        if (level1 > 16) level1 = 16;
        if (level1 > 64) level1 = 64;
        if (level1 > 256) level1 = 256;

        let firstReferrals = [];
        referralsTree.children.forEach(child => {
            firstReferrals.push(child.id);
        })

        let matrixNetworkInfo = {
            id: referralsTree.id,
            parentId: referralsTree.parentId,
            firstReferrals: firstReferrals,
            level1: level1,
            level2: level2,
            level3: level3,
            level4: level4,
            network: level1 + level2 + level3 + level4
        };

        return matrixNetworkInfo;
    }

    getReferralType(matrixReferrals, allUserMatrices) {
        let res = [];
        for (let i = 0; i < 4; i++) {
            let refId = matrixReferrals[i];
            if (typeof refId === 'undefined') refId = 0;

            if (allUserMatrices.includes(refId)) {
                res.push({ id: refId, type: "user" });
            } else {
                res.push({ id: refId, type: "other" });
            }
        }
        return res;
    }

    async areMatricesActive() { //TODO: confirm that initGlobalCycle is completed, bunchCyclesLimit is completed
        await this.checkMatrixStatus(this.state.currentMatrix.id, this.state.currentMatrix.bunchCycles);
        if (this.state.userMatricesIds.length > 1) {
            for (let i = 1; i < this.state.userMatricesIds.length; i++) {
                await this.checkMatrixStatus(this.state.userMatricesIds[i]);
            }
        }

        this.processInactiveMatrixResult();
    }

    async checkMatrixStatus(matrixId, bunchCycles) {
        //console.log("Checking matrix " + matrixId);
        if (!bunchCycles) {
            let matrix = await Utils.getCleanMatrix(matrixId);
            bunchCycles = matrix.bunchCycles;
        }

        if (this.state.bunchCyclesLimit === 0) {
            console.error("bunchCyclesLimit is 0");
        } else if (bunchCycles >= this.state.bunchCyclesLimit) {
            let inactiveMatrices = this.state.inactiveMatrices;
            inactiveMatrices.push(matrixId);
            this.setState({ inactiveMatrices: inactiveMatrices });
        }
    }

    processInactiveMatrixResult() {
        if (this.state.inactiveMatrices.length > 0) {
            console.warn("User has inactive matrices. id: " + this.state.inactiveMatrices.join(', '));
            let isOneMatrix = this.state.inactiveMatrices.length === 1;
            let html = 'We have noticed that your ';
            html += (isOneMatrix ? '<b>matrix ' : '<b>matrices ') + this.state.inactiveMatrices.join(', ');
            html += (isOneMatrix ? '</b> has ' : '</b> have ') + ' cycled more than ' + this.state.bunchCyclesLimit + ' times.';
            html += '<p>To be able to cycle again please renew ' + (isOneMatrix ? 'it' : 'them') + '</p>'

            Swal.fire({
                icon: 'info',
                title: 'Inactive matrices detected',
                confirmButtonText: "Thank you for info",
                html: html
            });
        }
    }

    //Obsolete
    processSkippedMatrixResult() {
        if (this.state.skippedMatrices.length > 0)
            console.log("User has skipped matrices. id: " + this.state.skippedMatrices.join(', '));

        if (this.state.skippedMatrices.length === this.state.userMatricesIds.length) {
            let isOneMatrix = this.state.skippedMatrices.length === 1;

            let html = 'We have noticed that your ';
            html += (isOneMatrix ? 'matrix ' : 'matrices ') + this.state.skippedMatrices.join(', ');
            html += (isOneMatrix ? ' was' : ' were') + ' skipped. <p>To be able cycle again please purchase new HPEASY<br>';
            Swal.fire({
                icon: 'info',
                title: 'Skipped matrices detected',
                confirmButtonText: "Thank you for info",
                html: html
            })
        }
    }
    //#endregion


    // #region Payment Events (for transactions table)
    async initPaymentEvents() {
        if (this.state.userId === 0) { console.error("USER ID NOT SET"); return };

        let transferEvents = await Utils.getContractTransferEventsByUser("Transfer", this.state.address.toLocaleLowerCase());
        this.processTransferEvents(transferEvents);
    }


    processTransferEvents(transferEvents) {
        let transactions = [];
        let matrixErnings = 0;
        let hpEarnings = 0;

        for (let i = 0; i < transferEvents.length; i++) {
            // eslint-disable-next-line 
            if (transferEvents[i].returnValues.amount == this.state.PURCHASE_COST_ETH * 3 / 10) { //TODO: make changable
                hpEarnings += parseInt(transferEvents[i].returnValues.amount);
                transactions.push({
                    type: 'HP',
                    id: transferEvents[i].transactionHash,
                    date: this.getDateFromTimestamp(transferEvents[i].block_timestamp * 1000),
                    amount: transferEvents[i].returnValues.amount,
                });
            } else {
                matrixErnings += parseInt(transferEvents[i].returnValues.amount);
                transactions.push({
                    type: 'MATRIX',
                    id: transferEvents[i].transactionHash,
                    date: this.getDateFromTimestamp(transferEvents[i].block_timestamp * 1000),
                    amount: transferEvents[i].returnValues.amount,
                });
            }
        }

        this.setState({ hpEarningEth: hpEarnings / 1000000000000000000 });
        this.setState({ matrixEarningEth: matrixErnings / 1000000000000000000 });
        this.setState({ transactions: transactions });
    }
    // #endregion


    //#region JACKPOT
    async getJackpotPayload() {
        if (this.state.isJackpotInfoLoaded) return;

        //setTimeout(function () { //random fill
        let jackpotLoad = [];

        for (let line = 0; line < myConfig.JACKPOT_LINES.length; line++) {
            for (let bet = 0; bet < myConfig.JACKPOT_BETS.length; bet++) {
                let bets = await Utils.getBetFill(myConfig.JACKPOT_LINES[line], myConfig.JACKPOT_BETS[bet]);
                //let bets = this.getRandomInt(0, myConfig.JACKPOT_LINES[line]); //random fill
                let winners = await Utils.getJackpotWinnerEvents(myConfig.JACKPOT_LINES[line], myConfig.JACKPOT_BETS[bet]);
                jackpotLoad.push({
                    line: myConfig.JACKPOT_LINES[line],
                    betSize: myConfig.JACKPOT_BETS[bet],
                    betsCount: bets,
                    winnersCount: winners.length,
                    lastWinner: winners.length > 0 ? winners[winners.length - 1].returnValues.winnerAddress : '',
                    txId: winners.length > 0 ? winners[winners.length - 1].transaction_id : ''
                });
            }
        }
        this.setState({ jackpotLoad: jackpotLoad });
        //}.bind(this), 1000); //random fill
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }
    //#endregion


    // #region ================================ UTILS ================================ 
    secondsToTime(d) {
        d = Number(d);
        let h = Math.floor(d / 3600);
        let m = Math.floor(d % 3600 / 60);
        let s = Math.floor(d % 3600 % 60);

        let hDisplay = h === 0 ? "00" : h;
        let mDisplay = m === 0 ? "00" : m;
        let sDisplay = s === 0 ? "00" : s;

        return hDisplay + ":" + mDisplay + ":" + sDisplay;
    }

    findCooldownTime(d) {
        if (this.state.hpeasyCooldownNum !== 3)
            return "00:00:00";

        let difference = new Date() - new Date(d * 1000);
        let seconds = parseInt(difference / 1000);

        if (seconds > 86400)
            return "00:00:00";

        let revertedSeconds = 86400 - seconds;

        let h = Math.floor(revertedSeconds / 3600);
        let m = Math.floor(revertedSeconds % 3600 / 60);
        let s = Math.floor(revertedSeconds % 3600 % 60);

        let hDisplay = h === 0 ? "00" : h < 10 ? "0" + h : h;
        let mDisplay = m === 0 ? "00" : m < 10 ? "0" + m : m;
        let sDisplay = s === 0 ? "00" : s < 10 ? "0" + s : s;

        return hDisplay + ":" + mDisplay + ":" + sDisplay;
    }

    getDateFromTimestamp(timestamp) { //TODO
        return new Date(timestamp).toISOString().replace('-', '/').split('T')[0].replace('-', '/');
    }

    convertToUsd(amount) {
        return amount * this.state.ETH_TO_USD / 1000000000000000000;
    }

    convertToUsdAndRound(amount) {
        return (amount * this.state.ETH_TO_USD / 1000000000000000000).toFixed(2);
    }

    truncateLong(hash, toLeave) {
        return hash.substring(0, toLeave) + "…";
    }
    // #endregion


    // #region ========================== BUTTONS FUNCTIONS ==========================
    async reloadMatrixLevelUpDown(matrixId) {
        if (matrixId === 0) return;

        await this.getMatrixInfo(matrixId);
        // eslint-disable-next-line
        if (matrixId == this.state.lastUserMatrixId) {
            this.setState({ isMatrixOfCurrentUser: true });
        } else {
            this.setState({ isMatrixOfCurrentUser: false });
        }
        this.getMatrixNetworkInfo(matrixId);
    }

    async changeToPreviousMatrix(event) {
        if ((this.state.matrixIndex) === 0) return;

        await this.getMatrixInfo(this.state.userMatricesIds[this.state.matrixIndex - 1]);
        this.setState({ matrixIndex: this.state.matrixIndex - 1 });
        this.setState({ lastUserMatrixId: this.state.userMatricesIds[this.state.matrixIndex] });
        this.getMatrixNetworkInfo(this.state.userMatricesIds[this.state.matrixIndex]);
    }

    async changeToNextMatrix(event) {
        if ((this.state.matrixIndex + 1) === this.state.matricesCnt) return;

        await this.getMatrixInfo(this.state.userMatricesIds[this.state.matrixIndex + 1]);
        this.setState({ matrixIndex: this.state.matrixIndex + 1 });
        this.setState({ lastUserMatrixId: this.state.userMatricesIds[this.state.matrixIndex] });
        this.getMatrixNetworkInfo(this.state.userMatricesIds[this.state.matrixIndex]);
    }

    async handleShowJackpot() {
        this.setState({ isJackpotInfoBlock: !this.state.isJackpotInfoBlock });
        if (!this.state.isJackpotInfoLoaded) {
            this.getJackpotPayload();
            this.checkJackpotPaymentStatus();
        }
    }

    async checkJackpotPaymentStatus() {
        let jackpotQueue = await Utils.getJackpotQueue();
        jackpotQueue.betSize = parseInt(jackpotQueue.betSize.replace("000000000000", "")) / 1000000;
        this.setState({ jackpotQueue: jackpotQueue });

        if (jackpotQueue === null) {
            if (this.state.isRegistered) {
                Swal.fire({
                    title: 'Connection problem',
                    icon: 'error',
                    text: 'Sorry, can\'t get jackpot payment status for current user, please retry'
                })
            }

            return;
        }

        if (jackpotQueue.isEthPaid) {
            Swal.fire({
                icon: 'info',
                title: 'Not complete bet',
                showCancelButton: true,
                confirmButtonText: "Let's do it now!",
                cancelButtonText: "I need to think",
                html: 'We have noticed that you have already paid <b>' + jackpotQueue.betSize + "&nbsp;ETH</b> to join Jackpot <b>line&nbsp;" + jackpotQueue.line + "</b>.</p> <p>Only one step's left to join this jackpot line: <br><b>" + jackpotQueue.betSize + "&nbsp;EASY</b> payment needed <br>" + (this.state.easyBalance >= jackpotQueue.betSize ? "<i>(it will be withdrawn from your&nbsp;EASY balance)</i>" : (" <i>(it costs <b>" + jackpotQueue.betSize / this.state.ETH_TO_EASY + "&nbsp;EASY</b>)<i></p>"))
            }).then(result => {
                if (result.isConfirmed) {
                    this.joinJackpotEasy(jackpotQueue.line, jackpotQueue.betSize, false);
                }
            });
        } else if (jackpotQueue.isTokensPaid) {
            Swal.fire({
                icon: 'info',
                title: 'Not complete bet',
                showCancelButton: true,
                confirmButtonText: "Let's do it now!",
                cancelButtonText: "I need to think",
                html: 'We have noticed that you have already paid <b>' + jackpotQueue.betSize + "&nbsp;EASY</b> to join Jackpot <b>line&nbsp;" + jackpotQueue.line + "</b>.</p> <p>Only one step's left to join this jackpot line: <br><b>" + jackpotQueue.betSize + "&nbsp;ETH</b> payment needed</p>"
            }).then(result => {
                if (result.isConfirmed) {
                    this.joinJackpotEth(jackpotQueue.line, jackpotQueue.betSize, false);
                }
            });
        }
    }

    async handleShowJackpotParticipants(line, betSize) {
        let participants = await Utils.getJackpotParticipants(line, betSize);
        let html = '';
        participants.forEach(address => {
            html += "<span class='swal-addresses'>" + address + "</span><br>";
        });

        Swal.fire({
            icon: 'info',
            title: 'Participants of line ' + line + ',<br> bet size ' + betSize + '&nbsp;ETH/EASY',
            html: html
        });
    }

    async handleJoinJackpot(line, betSize) {
        if (!this.state.useToken) {
            Swal.fire({
                    imageUrl: jackpotWhite,
                    imageWidth: 300,
                    imageHeight: 193,
                    imageAlt: 'Jackpot image',
                    title: 'Confirm your bet',
                    showCancelButton: true,
                    confirmButtonText: "Let's go!",
                    html: 'Do you confirm you want to pay <b>' + betSize + "&nbsp;ETH</b> <br>  to join Jackpot <b>" + line + "&nbsp;line</b> <p>Jackpot size is <b>" + (betSize * line * 0.9).toFixed(3) + " ETH</b></p>",
                }).then(result => {
                    if (result.isConfirmed) {
                        this.joinJackpotEth(line, betSize, false);
                    }
                });
            return;
        }
        
        if (this.state.jackpotQueue === null) {
            Swal.fire({
                icon: 'error',
                title: 'Connection problem',
                text: 'Sorry, can\'t get jackpot payment status for current user, please retry'
            })
            return;
        }

        let queue = this.state.jackpotQueue;
        if ((queue.isTokensPaid && (queue.line !== line || queue.bets !== betSize))
            || (queue.isEthPaid && (queue.line !== line || queue.bets !== betSize))) {
            Swal.fire({
                icon: 'info',
                title: 'Pending payment for other bet',
                showCancelButton: true,
                confirmButtonText: "Let's finish previous bet",
                cancelButtonText: "I need to think",
                html: "We have noticed that you have unfinished bet (line&nbsp;" + queue.line + ", bet size " + queue.betSize + "&nbsp;ETH/EASY). <p>You can't make a new bet without finishing payment for the previous bet. <p>Do you want to finish payment?",
            }).then(result => {
                if (result.isConfirmed) {
                    if (queue.isTokensPaid) {
                        this.joinJackpotEth(queue.line, queue.betSize, false);
                    } else if (queue.isEthPaid) {
                        this.joinJackpotEasy(queue.line, queue.betSize, false);
                    }
                } else {
                    this.setState({ loader: false });
                }
            });
        } else {
            if (myConfig.JACKPOT_LINES.includes(line) && myConfig.JACKPOT_BETS.includes(betSize)) {
                let isExtraTokensNeeded = this.state.easyBalance - betSize < 0;
                Swal.fire({
                    imageUrl: jackpotWhite,
                    imageWidth: 300,
                    imageHeight: 193,
                    imageAlt: 'Jackpot image',
                    title: 'Confirm your bet',
                    showCancelButton: true,
                    confirmButtonText: "Let's go!",
                    html: 'Do you confirm you want to pay <b>' + betSize + "&nbsp;EASY</b> <br> " + (isExtraTokensNeeded ? "<i>(it cost <b>" + betSize / this.state.ETH_TO_EASY + "&nbspETH</b>)</i>" : "<i>(it will be withdrawn from your&nbsp;EASY balance)</i><br>") + " to join Jackpot <b>" + line + "&nbsp;line</b> <p>Jackpot size is <b>" + (betSize * line * 0.9).toFixed(3) + " ETH/EASY</b></p>",
                }).then(result => {
                    if (result.isConfirmed) {
                        this.joinJackpotEasy(line, betSize, true);
                    }
                });
            }
        }
    }

    async joinJackpotEasy(line, betSize, isEthNeeded) {
        this.setState({ loader: true });

        if (betSize <= this.state.easyBalance) {
            await Utils.joinJackpotEasyExistingTokens(line, (betSize * 1000000).toString() + "000000000000")
                .then(
                    result => this.processJoinJackpotEasySuccess(line, betSize, isEthNeeded),
                    error => this.handleErroredTransaction(error, 'Ok, I\'ll check the result manually', true)
                ).catch(err => {
                    this.setState({ loader: false });
                    console.error("Error");
                    console.error(err);
                });
        } else {
            await Utils.joinJackpotEasyNewTokens(line, betSize * 1000000000000000000 / this.state.ETH_TO_EASY)
                .then(
                    result => this.processJoinJackpotEasySuccess(line, betSize, isEthNeeded),
                    error => this.handleErroredTransaction(error, 'Ok, I\'ll check the result manually', true)
                ).catch(err => {
                    this.setState({ loader: false });
                    console.error("Error");
                    console.error(err);
                });
        }

    }

    processJoinJackpotEasySuccess(line, betSize, isEthNeeded) {
        let html = isEthNeeded
            ? "<p>Nice, " + betSize + "&nbsp;EASY is paid! <br> One step separates you from your luck!</p> <p>Now you need to pay " + betSize + "&nbsp;ETH</p>"
            : "<p>Congradulation! You have joined jackpot line <b>" + line + "</b> with bet size <b>" + betSize + "&nbsp;ETH/EASY</b></p>.<p>Jackpot prize is: <b>" + (line * betSize * 0.9).toFixed(3) + "&nbsp;ETH</b>!!!.</p><p>We wish you luck!</p>";

        Swal.fire({
            icon: isEthNeeded ? 'info' : 'success',
            title: 'Success',
            confirmButtonText: isEthNeeded ? 'Let\'s do it now' : 'Great!',
            showCancelButton: isEthNeeded,
            cancelButtonText: "I'll do it later",
            html: html
        }).then((result) => {
            if (isEthNeeded && result.isConfirmed) {
                this.joinJackpotEth(line, betSize, false);
            }
            else {
                window.location.reload();
            }
        });
    }

    async joinJackpotEth(line, betSize, isEasyNeeded) {
        this.setState({ loader: true });

        await Utils.joinJackpotEth(line, (betSize * 1000000).toString() + "000000000000")
            .then(
                result => {
                    let html = "Congradulation! You have joined jackpot line <b>" + line + "</b> with bet size <b>" + betSize + "&nbsp;ETH/EASY</b>.<p>Jackpot prize is: <b>" + (line * betSize * 0.9).toFixed(3) + "&nbsp;ETH</b>!!!.</p><p>We wish you luck!</p>";

                    Swal.fire({
                        title: 'Success',
                        icon: 'success',
                        confirmButtonText: 'Ok',
                        html: html
                    }).then((result) => {
                        this.setState({ loader: false });
                    });
                },
                error => {
                    this.handleErroredTransaction(error, 'Ok, I\'ll check the result manually', true);
                })
            .catch(
                err => {
                    this.setState({ loader: false });
                    console.error("Error");
                    console.error(err);
                });

    }

    async registrationCheck(actionName) {
        if (!this.state.isRegistered) {
            Swal.fire({
                icon: 'warning',
                title: 'Not logged in',
                showCancelButton: true,
                cancelButtonText: 'Got it',
                confirmButtonText: 'Ok, let\'s login/register',
                html: "<p>To " + actionName + " you need to login to your dashboard</p><p>If you want to login to your dashboard, please go to home page and press 'LOGIN/REGISTER' button</p>"
            }).then((result) => {
                if (result.isConfirmed) {
                    this.props.history.push('/');
                }
            });;
            return false;
        } else {
            return true;
        }
    }


    logout() {
        this.props.history.push('/');
    }

    onLoaderChange(showLoader) {
        if (typeof showLoader === 'boolean' && showLoader !== null) {
            this.setState({ loader: showLoader });
        } else {
            this.setState({ loader: !this.state.loader });
        }
    }
    // #endregion

    handleErroredTransaction(error, okButtonText, doReload = true) {
        Swal.fire({
            icon: 'error',
            title: 'Fail',
            html: error
        }).then((result) => {
            console.log("General error");
            this.setState({ loader: false });
        });
    }

    render() {
        return (
            <div className="dashboard-container">

                {/* !!! HEADER !!! */}
                <div className="main_head dashboard-page" >
                    <div className="logo">
                        <img className="logo-header" alt="logo" src={logo} />
                    </div>

                    <div className="extra-buttons">
                        <img className="jackpot" alt="logo" src={this.state.isJackpotInfoBlock ? require('../../assets/left_arrow.png') : jackpot} onClick={this.handleShowJackpot.bind(this)} />
                        <BuyEasy
                            onLoaderChange={this.onLoaderChange.bind(this)}
                            isRegistered={this.state.isRegistered}
                            viewerAddress={this.state.viewerAddress}
                            easyAccountBalance={this.state.easyAccountBalance}
                            easyBalance={this.state.easyBalance}
                            ETH_TO_EASY={this.state.ETH_TO_EASY}
                        />
                    </div>

                    <div className="header_container">
                        <div className="head_first">
                            <h1 className="stats-users-total">{this.state.totalUsers}</h1>
                            <h1 className="stats-users-hp">{this.state.totalHPEasys}</h1>
                        </div>
                        <div className="head_second">
                            <h3>All<br />Participants</h3>
                            <h3>All<br />HP's</h3>
                        </div>
                    </div>
                    <div className="log">
                        <h2 className="head_third">SPONSOR ID:&nbsp;<span className="user-referrer">{this.state.sponsorId}</span> </h2>
                        <div className="logTranslate">
                            <div className="logout" onClick={this.logout.bind(this)}>{this.state.isRegistered ? 'LOGOUT' : 'EXIT'}</div>
                            <div id="google_translate_element"></div>
                        </div>
                    </div>
                    <div className="language-area"></div>
                </div>

                <div className="main dashboard-page">
                    <div className="main_left">

                        {/* !!! GENERAL INFO !!! */}
                        <div className="id">
                            <h1 className="id_first_h1">ID&nbsp;<span className="user-id">{this.state.userId}</span> </h1>
                            <h1 className="id_second_h1">
                                <span className="subtitle">Direct Referrals</span>
                                <span>$<span className="user-earnings-total-usd">{((this.state.matrixEarningEth + this.state.hpEarningEth) * this.state.ETH_TO_USD + (this.state.matrixEarningEth + this.state.hpEarningEth) * this.state.ETH_TO_USD / this.state.ETH_TO_EASY).toFixed(2)}</span></span>
                            </h1>
                            <h1 className="id_third_h1">
                                <span className="user-direct">{this.state.directReferrals} </span>
                                <span><span className="user-earnings-total">{(this.state.matrixEarningEth + this.state.hpEarningEth).toFixed(4)}</span> ETH / {(this.state.matrixEarningEth + this.state.hpEarningEth).toFixed(4)} EASY</span></h1>
                            <div className="cards_first">
                                <div className="cards_front">MATRIX</div>
                                <div className="cards_back">
                                    <h1>$<span className="user-earnings-matrix-usd">{(this.state.matrixEarningEth * this.state.ETH_TO_USD).toFixed(2)}</span> {this.state.matrixEarningEth !== 0 ? " + $" + (this.state.matrixEarningEth * this.state.ETH_TO_USD / this.state.ETH_TO_EASY).toFixed(2) : ""}</h1>
                                    <h3><span className="user-earnings-matrix">{this.state.matrixEarningEth}</span> ETH + {this.state.matrixEarningEth} EASY</h3>
                                    <h4 className="user-matrices-cnt">{this.state.matricesCnt}</h4>
                                </div>
                            </div>
                            <div className="cards_first">
                                <div className="cards_front">HP</div>
                                <div className="cards_back">
                                    <h1>$<span className="user-earnings-hp-usd">{(this.state.hpEarningEth * this.state.ETH_TO_USD).toFixed(2)}</span> {this.state.hpEarningEth !== 0 ? " + $" + (this.state.hpEarningEth * this.state.ETH_TO_USD / this.state.ETH_TO_EASY).toFixed(2) : ''}</h1>
                                    <h3><span className="user-earnings-hp">{this.state.hpEarningEth}</span> ETH + {this.state.hpEarningEth} EASY</h3>
                                    <h4><span className="user-hp-cnt">{this.state.matricesCnt}</span>/150</h4>
                                </div>
                            </div>
                            <div className="cards_second">
                                <div className="cards_front">
                                    <p>REFERRAL LINK</p>
                                </div>
                                <div className="cards_back scroll">
                                    <p className="affil-link readonly">https://hpeasy-eth.io/{this.state.userId}</p>
                                </div>
                            </div>
                            <div className="cards_second">
                                <div className="cards_front">
                                    <p>{this.state.isRegistered ? 'YOUR' : 'ACCOUNT'} WALLET</p>
                                </div>
                                <div className="cards_back scroll">
                                    <a className="user-address readonly" target="_blank" rel="noopener noreferrer" href={myConfig.ETHERSCAN_DOMAIN + "address/" + this.state.address}>{this.state.address}</a>
                                </div>
                            </div>
                            <div className="cards_second">
                                <div className="cards_front">
                                    <p>CONTRACT</p>
                                </div>
                                <div className="cards_back scroll">
                                    <a className="contract-address" target="_blank" rel="noopener noreferrer" href={myConfig.ETHERSCAN_DOMAIN + "address/" + myConfig.CONTRACT_ADDRESS_HPEASY + "/code"}>{myConfig.CONTRACT_ADDRESS_HPEASY}</a>
                                </div>
                            </div>
                        </div>

                        {/* !!! BUY HP !!! */}
                        <div className="front_button_hp">
                            HP
                        </div>
                        <div className="hp">
                            <BuyHpEasy
                                key={"buyHpEasy"}
                                isRegistered={this.state.isRegistered}
                                onLoaderChange={this.onLoaderChange.bind(this)}
                                hpeasyCooldownNum={this.state.hpeasyCooldownNum}
                                hpeasyCooldownTime={this.state.hpeasyCooldownTime}
                                pageIsReady={this.state.pageIsReady}
                                easyBalance={this.state.easyBalance}
                                isRenew={false}
                                useToken={this.state.useToken}
                                PURCHASE_COST_ETH={this.state.PURCHASE_COST_ETH}
                                PURCHASE_COST_EASY={this.state.PURCHASE_COST_EASY}
                                PURCHASE_COST_EASY_ETH_EQUIVALENT={this.state.PURCHASE_COST_EASY_ETH_EQUIVALENT}
                            />
                            <h2><span id="hp-cooldown-num">{this.state.hpeasyCooldownNum}</span>/3</h2>
                            <h1 id="hp-cooldown-time">{this.findCooldownTime(this.state.hpeasyCooldownTime)}</h1>
                        </div>
                    </div>

                    <div key="matrices-info" className="main_right" style={{ display: this.state.isJackpotInfoBlock ? 'none' : 'block' }}>

                        {/* MATRICES */}
                        <div className="main_right_topBar">
                            <div className="mian_top_div" id="matrix-up-btn" onClick={() => this.reloadMatrixLevelUpDown(this.state.currentMatrix.matrixReferrer)}>
                                <img alt="top_arrow" src={require('../../assets/top_arrow.png')} />
                                <p>HP <span id="matrix-referrer">{this.state.currentMatrix.matrixReferrer !== 0 ? this.state.currentMatrix.matrixReferrer : ''} <span style={{ display: this.state.referMatrixOwnerId ? 'inline' : 'none' }} className="submatrix-description">(USER {this.state.referMatrixOwnerId})</span></span></p>
                            </div>
                            <div className="main_right_top_container">
                                <div className="arrow_area matrix-own" style={{ visibility: this.state.isMatrixOfCurrentUser ? 'initial' : 'hidden' }}>
                                    <img onClick={this.changeToPreviousMatrix.bind(this)} alt="left_arrow" src={require('../../assets/left_arrow.png')} id="matrix-prev-btn" />
                                    <div className="arrow_desc">
                                        <p>HP</p>
                                        <div><span id="matrix-prev" >{this.state.userMatricesIds[this.state.matrixIndex - 1]}</span></div>
                                    </div>
                                </div>
                                <div className="id_card">
                                    <div className="id_card_id">
                                        <div className="id_card_head_container">
                                            <p className="id_card_left_first">HP <span id="matrix-id">{this.state.currentMatrix.id}</span></p>
                                        </div>
                                        <div className="id_card_countArea">
                                            <div className="matrix-own" style={{ visibility: this.state.isMatrixOfCurrentUser ? 'initial' : 'hidden' }}>
                                                <p>CYCLE</p>
                                                <p className="matrix-cycles">{this.state.currentMatrix.cycles}</p>
                                            </div>
                                            <div className="matrix-own" style={{ visibility: this.state.isMatrixOfCurrentUser ? 'initial' : 'hidden' }}>
                                                <p>BUNCH<br /> CYCLE</p>
                                                <p className="matrix-cycles">{this.state.currentMatrix.bunchCycles}</p>
                                            </div>
                                            <div className="matrix-own" style={{ visibility: this.state.isMatrixOfCurrentUser ? 'initial' : 'hidden' }}>
                                                <p>HP</p>
                                                <p><span className="matrix-index">{this.state.matrixIndex + 1}</span>/<span className="user-hp-cnt">{this.state.matricesCnt}</span> </p>
                                            </div>
                                            <div>
                                                <p>NETWORK</p>
                                                <p id="matrix-network">{this.state.network}</p>
                                            </div>
                                            <div className="matrix-legend">
                                                <span>Level1: <span className="matrix-network-0">{this.state.level1}</span> </span>
                                                <span>Level2: <span className="matrix-network-1">{this.state.level2}</span> </span>
                                                <span>Level3: <span className="matrix-network-2">{this.state.level3}</span> </span>
                                                <span>Level4: <span className="matrix-network-3">{this.state.level4}</span> </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="unrenewedHp" style={{
                                        display: this.state.currentMatrix.bunchCycles >= this.state.bunchCyclesLimit ? 'block' : 'none'
                                    }}></div>
                                    {(this.state.isMatrixOfCurrentUser && this.state.currentMatrix.bunchCycles >= this.state.bunchCyclesLimit)
                                        && <BuyHpEasy
                                            key={"renewHpEasy"}
                                            isRegistered={this.state.isRegistered}
                                            onLoaderChange={this.onLoaderChange.bind(this)}
                                            hpeasyCooldownNum={this.state.hpeasyCooldownNum}
                                            hpeasyCooldownTime={this.state.hpeasyCooldownTime}
                                            totalHPEasys={this.state.totalHPEasys}
                                            easyBalance={this.state.easyBalance}
                                            isRenew={true}
                                            useToken={this.state.useToken}
                                            pageIsReady={this.state.pageIsReady}
                                            matrixToRenew={this.state.currentMatrix.id}

                                            PURCHASE_COST_ETH={this.state.PURCHASE_COST_ETH}
                                            PURCHASE_COST_EASY={this.state.PURCHASE_COST_EASY}
                                            PURCHASE_COST_EASY_ETH_EQUIVALENT={this.state.PURCHASE_COST_EASY_ETH_EQUIVALENT}
                                        />}
                                </div>
                                <div className="arrow_area matrix-own" style={{ visibility: this.state.isMatrixOfCurrentUser ? 'initial' : 'hidden' }}>
                                    <div className="arrow_desc">
                                        <p>HP</p>
                                        <div>
                                            <span id="matrix-next" >{this.state.userMatricesIds[this.state.matrixIndex + 1]}</span>
                                        </div>
                                    </div>
                                    <img onClick={this.changeToNextMatrix.bind(this)} alt="right_arrow" src={require('../../assets/right_arrow.png')} id="matrix-next-btn" />
                                </div>
                            </div>
                            <div className="ids_container">
                                <div className="ids_bubbles">
                                    {this.state.currentMatrix.referrals.map((ref, index) => (
                                        <div
                                            className={"matrix-ref" + (ref.id === 0 ? " empty" : ref.type === 'user' ? " green" : " orange")}
                                            key={"matrix-ref-" + index}
                                            onClick={() => this.reloadMatrixLevelUpDown(ref.id)}>
                                            {ref.id !== 0 ? ref.id : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="legend">
                                <div className="legend-item">
                                    <div className="legend-srcle empty"></div>
                                    <div className="legend-text">Empty</div>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-circle blue"></div>
                                    <div className="legend-text">Downlines</div>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-circle green"></div>
                                    <div className="legend-text">My New HP</div>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-circle orange"></div>
                                    <div className="legend-text">Spill Over</div>
                                </div>
                            </div>
                        </div>

                        {/* TRANSACTION TABLE */}
                        <div className="table_body" style={{ display: this.state.transactions.length > 0 ? 'block' : 'none' }}>
                            <table>
                                <thead className="thead">
                                    <tr>
                                        <th>HASH</th>
                                        <th>SYSTEM</th>
                                        <th>DATE</th>
                                        <th>$/ETH</th>
                                        <th>$/EASY</th>
                                    </tr>
                                </thead>
                                <tbody className="tbody">

                                    {this.state.transactions.map((transaction, index) => (
                                        <tr key={index}>
                                            <td >
                                                <a target="_blank" rel="noopener noreferrer" href={myConfig.ETHERSCAN_DOMAIN + "tx/" + transaction.id}>{this.truncateLong(transaction.id, 7)}</a>
                                            </td>
                                            <td>{transaction.type}</td>
                                            <td>{transaction.date}</td>
                                            <td>
                                                {this.convertToUsdAndRound(transaction.amount)} / {transaction.amount / 1000000000000000000}
                                            </td>
                                            <td>
                                                {this.convertToUsdAndRound(transaction.amount / this.state.ETH_TO_EASY)} / {transaction.amount / 1000000000000000000}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div key="jackpot-info" className="main_right" style={{ display: this.state.isJackpotInfoBlock ? 'block' : 'none' }}>
                        <div className="main_right_topBar jackpotInfo">
                            <p className="link" onClick={this.handleShowJackpot.bind(this)}>Back to matrices</p>
                            <p className="jackpot-load-dummy" style={{ display: this.state.jackpotLoad.length > 0 ? 'none' : 'block' }}>Loading jackpot info...</p>

                            <div className="jackpot-data" key="jackpotData" style={{ display: this.state.jackpotLoad.length > 0 ? 'block' : 'none' }}>
                                <div className="bet-fills-container">
                                    {this.state.jackpotLoad.map((betLine, index) => (
                                        <div key={betLine.line + "-" + betLine.betSize} className="line-info-wrapper" style={{ marginBottom: betLine.winnersCount > 0 ? '' : '50px' }}>
                                            <div className="line-info">
                                                <span className="line-label"><span>LINE: </span> {betLine.line} </span>
                                                <span className="bet-label"><span>BET SIZE: </span> {betLine.betSize} ETH/EASY</span>
                                            </div>
                                            <div>
                                                <div className="bet-fill-progress" style={{ background: 'linear-gradient(to right, #6286d2 0%, #3063bc ' + (betLine.betsCount * 100) / betLine.line + '%, #bac4d8 0%)' }}>{betLine.betsCount}</div>
                                                <div className="buy-easy join-jackpot" onClick={() => this.handleJoinJackpot(betLine.line, betLine.betSize)}>JOIN</div>
                                                <p><span className="sub-label">Jackpot size: </span><b>{(betLine.line * betLine.betSize * 0.9).toFixed(3)} ETH + {(betLine.line * betLine.betSize * 0.9).toFixed(3)} EASY</b></p>
                                                <p style={{ display: betLine.winnersCount > 0 ? 'block' : 'none' }} ><span className="sub-label">Total winners:</span> <b>{betLine.winnersCount}</b></p>
                                                <p style={{ display: betLine.lastWinner ? 'block' : 'none' }}>
                                                    <span className="sub-label">Last winner:</span> <span className="address-winner">
                                                        <a target="_blank" rel="noopener noreferrer" href={myConfig.ETHERSCAN_DOMAIN + "tx/" + betLine.txId}>{this.truncateLong(betLine.lastWinner, 20)}</a>
                                                    </span>
                                                </p>
                                                <p style={{ display: betLine.betsCount > 0 ? 'block' : 'none' }} className="link" onClick={() => this.handleShowJackpotParticipants(betLine.line, betLine.betSize)}>Show all participants</p>
                                                <div></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="darkener" style={{ display: this.state.loader ? 'block' : 'none' }}></div>
                <Loader
                    className="loader"
                    type="Oval"
                    color="#00BFFF"
                    height={100}
                    width={100}
                    visible={this.state.loader}
                />
            </div>
        );
    }
}

export default withRouter(Dashboard);
