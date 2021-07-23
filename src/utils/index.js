import { myConfig } from '../config.js';
import Web3 from 'web3';
import hpeasyAbi from './hpeasy_abi.json'
import easycoinAbi from './easycoin_abi.json';
import poolAbi from './pool_abi.json';


const utils = {
    web3: false,
    currentAddress: false,
    gasPrice: 900000000,
    contractHpEasy: false,
    contractEasyCoin: false,

    async setWeb3(window) {
        try {
            if (typeof window.ethereum !== 'undefined') {
                console.log("init browser web3");
                this.web3 = await new Web3(window.ethereum);
                window.ethereum.enable().catch(error => {
                    console.log("User denied account access, init infura web3");
                    this.web3 = new Web3(myConfig.INFURA_API);
                });
                this.currentAddress = await this.web3.eth.getCoinbase();
                //console.log("Account: " + this.currentAddress);
            } else {
                console.log("init Infura web3");
                this.web3 = await new Web3(myConfig.INFURA_API);
            }

            //console.log("Init other data");
            await fetch("https://ethgasstation.info/api/ethgasAPI.json?api-key=" + myConfig.GAS_STATION_API)
                .then(res => res.json())
                .then(
                    (result) => {
                        this.gasPrice = result.average * 100000000;
                    },
                    (error) => {
                        console.error("Can't get actual gas price, use default value instead");
                        this.gasPrice = 50000000000;
                    });

            this.web3.eth.transactionPollingTimeout = 120; // set wait transaction timeout to 120 seconds

            this.contractHpEasy = await new this.web3.eth.Contract(hpeasyAbi, myConfig.CONTRACT_ADDRESS_HPEASY);
            this.contractEasyCoin = await new this.web3.eth.Contract(easycoinAbi, myConfig.CONTRACT_ADDRESS_EASYCOIN);
            
            this.test();
        } catch (error) {
            console.error("Couldnot init web3 or contracts");
            console.error(error);
        }
    },

    
    async test() {
        /*
        let abi = poolAbi;
        
        let current = await this.web3.eth.getCoinbase();
        console.log(current);
        console.log(typeof current);
        let myContract = await new this.web3.eth.Contract(abi, '0x9946254a82c3b556c58479383e5d2b1baf9107a3');
        console.log(myContract);
        //console.log(current);
        console.log("object");
        myContract.events.Staked(
            { filter: { user: '0x55aAf5708707c7c6d404F11ABC739296A2e28Ef8' } },
            (err : any, event : any) => { 
              console.log(event);
            }
        );

        /*
        let code = this.myContract.methods.approve('0xb41bce1bd30f1207bae30123a73633049ebf7b99', '110000000000000000000000000').encodeABI(); 
        utils.web3.eth.sendTransaction({ 
            to: '0x5b6C8863f75aC05E6fC9eC7d03ADcA6F7225Ba96',
            from: current,
            data: code 
        }, function (err, transactionHash) {
            console.log(err);
            if (!err)
                console.log(transactionHash); 
        }); 
        */
    }, 

    // #region ADDRESS
    async fetchUserAddressById(userId) {
        try {
            return await this.contractHpEasy.methods.usersById(userId).call();
        } catch (error) {
            console.error(error);
        }
    },

    async isValidAddress(address) {
        return await this.web3.utils.isAddress(address);
    },
    // #endregion


    // #region OWNER actions
    async changeRegistrationCost(newCost) {
        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract HpEasy");
            utils.contractHpEasy.methods.changeRegistrationCost(newCost).send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice,
            }).then(res => {
                resolve(res);
            }).catch(error => {
                let message = utils.prepareMessage(error);

                console.error("HpEasy error:");
                console.error(error);
                reject(message);
            });
        })
    },

    async changeExchangeRate(newRate) {
        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract EASY COIN");
            utils.contractEasyCoin.methods.changeExchangeRate(newRate).send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice,
            }).then(res => {
                resolve(res);
            }).catch(error => {
                console.error("HpEasy error:");
                console.error(error);
                let message = utils.prepareMessage(error);
                reject(message);
            });
        })
    },

    async changeUseToken() {
        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract HPEASY");
            utils.contractHpEasy.methods.changeUseTokenPayment().send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice,
            }).then(res => {
                resolve(res);
            }).catch(error => {
                console.error("HpEasy error:");
                console.error(error);
                let message = utils.prepareMessage(error);
                reject(message);
            });
        })
    },

    async changeBunchCyclesLimit(newLimit) {
        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract HpEasy");
            utils.contractHpEasy.methods.changeBunchCyclesLimit(newLimit).send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice,
            }).then(res => {
                resolve(res);
            }).catch(error => {
                console.error("HpEasy error:");
                console.error(error);
                let message = utils.prepareMessage(error);
                reject(message);
            });
        })
    },

    async changeOwner(newOwnerAddress, contractAddress) {
        let contract;
        if (contractAddress === myConfig.CONTRACT_ADDRESS_HPEASY) {
            contract = this.contractHpEasy;
        } else if (contractAddress === myConfig.CONTRACT_ADDRESS_EASYCOIN) {
            contract = this.contractEasyCoin;
        } else {
            throw new Error('No such contract address');
        }

        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract " + contractAddress);
            contract.methods.transferOwnership(newOwnerAddress).send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice,
            }).then(res => {
                resolve(res);
            }).catch(error => {
                console.error("HpEasy error:");
                console.error(error);
                let message = utils.prepareMessage(error);
                reject(message);
            });
        })
    },

    async acceptOwnership(contractAddress) {
        let contract;
        if (contractAddress === myConfig.CONTRACT_ADDRESS_HPEASY) {
            contract = this.contractHpEasy;
        } else if (contractAddress === myConfig.CONTRACT_ADDRESS_EASYCOIN) {
            contract = this.contractEasyCoin;
        } else {
            throw new Error('No such contract address');
        }

        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract " + contractAddress);
            contract.methods.acceptOwnership().send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice,
            }).then(res => {
                resolve(res);
            }).catch(error => {
                console.error("HpEasy error:");
                console.error(error);
                let message = utils.prepareMessage(error);
                reject(message);
            });
        })
    },

    async transferFundsFromHpEasy(transferAddress, transferAmount) {
        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract HpEasy");
            utils.contractHpEasy.methods.transferFunds(transferAddress, transferAmount).send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice,
            }).then(res => {
                resolve(res);
            }).catch(error => {
                console.error("HpEasy error:");
                console.error(error);
                let message = utils.prepareMessage(error);
                reject(message);
            });
        })
    },

    async transferFundsFromEasy(transferAddress, transferAmount) {
        return new Promise(function (resolve, reject) {
            console.log("Start operating with contract EASY COIN");
            utils.contractEasyCoin.methods.transferFunds(transferAddress, transferAmount).send({
                from: utils.currentAddress,
                gasPrice: utils.gasPrice
            }).then(res => {
                resolve(res);
            }).catch(error => {
                console.error("HpEasy error:");
                console.error(error);
                let message = utils.prepareMessage(error);
                reject(message);
            });
        })
    },
    // #endregion


    // #region PAYMENT
    async registrationInEth(referrAddress, amount) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract HpEasy");

                utils.contractHpEasy.methods.register(referrAddress).send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice,
                    value: amount
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);

            }
        })
    },

    async payAndSendEasy(amount) {
        //console.log(await utils.web3.eth.getTransactionCount(utils.currentAddress, 'pending'));
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            //console.log(amount);
            try {
                /*
                let tx = {
                    from: utils.currentAddress,
                    to: myConfig.CONTRACT_ADDRESS_EASYCOIN,
                    value: amount,
                    data: utils.contractEasyCoin.methods.buyTokensAndTransfer(myConfig.CONTRACT_ADDRESS_HPEASY, []).encodeABI(),
                    gasPrice: utils.gasPrice,
                    gasLimit: 3200000
                }
                console.log(tx);
                utils.web3.eth.sendTransaction(tx).then(res => {
                    console.log(res);
                    resolve(res);
                }) */
                
                utils.contractEasyCoin.methods.buyTokensAndTransfer(myConfig.CONTRACT_ADDRESS_HPEASY, []).send({
                    from: utils.currentAddress,
                    value: amount,
                    gasPrice: utils.gasPrice
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);
            }
        });
    },

    async sendEasy(amount) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract EASY COIN");
                console.log(amount);

                utils.contractEasyCoin.methods.transferAndCall(myConfig.CONTRACT_ADDRESS_HPEASY, amount.toString(), []).send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);
            }
        });
    },

    async buyEasy(amount) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract EASY COIN");

                utils.contractEasyCoin.methods.buyTokens().send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice,
                    value: amount
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);
            }
        });
    },

    async purchaseInEth(amount) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract HpEasy");
                utils.contractHpEasy.methods.purchaseHpEasyPosition().send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice,
                    value: amount
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);
            }
        })
    },

    async renewInEth(amount, matrixToRenew) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract HpEasy");
                utils.contractHpEasy.methods.renewMatrix(matrixToRenew).send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice,
                    value: amount
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);
            }
        })
    },



    // #endregion


    // #region JACKPOT
    async getBetFill(line, bet) {
        try {
            return await this.contractHpEasy.methods.betsLineFilling(line, (bet * 1000000).toString() + "000000000000").call();
        } catch (error) {
            console.error(error);
            return null;
        }

    },

    async getJackpotParticipants(line, bet) {
        try {
            return await this.contractHpEasy.methods.betsLineAddresses(line, (bet * 1000000).toString() + "000000000000").call();
            //let prtcpnts = Array(participants.participants);
            //return prtcpnts[0];
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getJackpotQueue() {
        if (!this.currentAddress) return null;
        try {
            let res = await this.contractHpEasy.methods.jackpotQueue(this.currentAddress).call();
            return {
                isTokensPaid: res.is_tokens_paid,
                isEthPaid: res.is_eth_paid,
                line: res.line,
                betSize: res.bet_size
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async joinJackpotEth(line, bet) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract HpEasy");
                utils.contractHpEasy.methods.joinJackpot(line).send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice,
                    value: bet
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);

            }
        })
    },

    async joinJackpotEasyNewTokens(line, betSize) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract EASY COIN");
                let serializedInt = utils.getInt32Bytes(line);

                utils.contractEasyCoin.methods.buyTokensAndTransfer(myConfig.CONTRACT_ADDRESS_HPEASY, serializedInt).send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice,
                    value: betSize
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);
            }
        })
    },

    async joinJackpotEasyExistingTokens(line, betSize) {
        return new Promise(function (resolve, reject) {
            if (!utils.currentAddress) reject("Not allowed operation for infura user");
            try {
                console.log("Start operating with contract EASY COIN");
                let serializedInt = utils.getInt32Bytes(line);

                utils.contractEasyCoin.methods.transferAndCall(myConfig.CONTRACT_ADDRESS_HPEASY, betSize.toString(), serializedInt).send({
                    from: utils.currentAddress,
                    gasPrice: utils.gasPrice
                }).then(res => {
                    console.log(res);
                    resolve(res);
                }).catch(error => {
                    console.error("HpEasy error:");
                    console.error(error);
                    let message = utils.prepareMessage(error);
                    reject(message);
                });
            } catch (error) {
                console.log("UNEXPECTED ERROR");
                console.error(error);
                reject("UNEXPECTED ERROR. " + error);
            }
        })
    },
    // #endregion


    // #region MATRICES Info
    async isUserExists() {
        if (!this.currentAddress) return false;
        try {
            //web3.eth.getAccounts(accounts => console.log(accounts[0]))
            return await this.contractHpEasy.methods.isUserExists(this.currentAddress).call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async isCurrentUserExists() {
        if (!this.currentAddress) return false;
        try {
            return await this.contractHpEasy.methods.isUserExists(this.currentAddress).call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getCurrentUser() {
        if (!this.currentAddress) return null;
        try {
            return await this.contractHpEasy.methods.users(this.currentAddress).call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getCurrentUserClean() {
        if (!this.currentAddress) return null;
        try {
            let address = this.currentAddress;
            let user = await this.contractHpEasy.methods.users(address).call();
            return this.parseUserParams(user, address);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    getCurrentUserAddress() {
        return this.currentAddress;
    },

    async getCleanUser(address) {
        try {
            if (!await this.isValidAddress(address)) return null;
            let user = await this.contractHpEasy.methods.users(address).call();
            return this.parseUserParams(user, address);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUserById(id) {
        try {
            let address = await this.getUserAddressById(id);
            return await this.contractHpEasy.methods.users(address).call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUserByIdClean(id) {
        try {
            let address = await this.getUserAddressById(id);
            let user = await this.contractHpEasy.methods.users(address).call();
            return this.parseUserParams(user, address);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUserByAddressClean(address) {
        try {
            let user = await this.contractHpEasy.methods.users(address).call();
            return this.parseUserParams(user, address);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUserAddressById(id) {
        try {
            return await this.contractHpEasy.methods.usersById(id).call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    parseUserParams(user, address) {
        return {
            userId: parseInt(user.id),
            address: address,
            currentMatrix: parseInt(user.current_matrix),
            directReferrals: parseInt(user.direct_referrals),
            hpeasyCooldownTime: parseInt(user.hpeasy_cooldown_time),
            hpeasyCooldownNum: parseInt(user.hpeasy_cooldown_num),
            lastMatrix: parseInt(user.last_matrix),
            matricesCnt: parseInt(user.matrices_cnt),
            referrer: user.referrer,
        }
    },

    // #endregion


    // #region GENERAL Contract Info
    async getTotalUsers() {
        try {
            return await this.contractHpEasy.methods.lastUserId().call() - 1;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getTotalHpEasys() {
        try {
            let lastHpEasyId = await this.contractHpEasy.methods.lastHpEasyId().call();
            return lastHpEasyId - 1;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getRegistrationCost() {
        try {
            return await this.contractHpEasy.methods.regCost().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getRegistrationCostEasyInEthEquivalent(registrationCostEth, exchangeRate) {
        let registrationCost;

        if (typeof registrationCostEth !== 'undefined' && registrationCostEth !== null) {
            registrationCost = registrationCostEth;
        } else {
            registrationCost = await this.getRegistrationCost();
            if (registrationCost === null) return null;
        }

        if (typeof exchangeRate === 'undefined' || exchangeRate === null || exchangeRate === 0) {
            exchangeRate = await this.getExchangeRate();
            if (exchangeRate === null) return null;
        }

        return registrationCost / exchangeRate;
    },

    async getLastCycle() {
        let totalHpEasys = await this.getTotalHpEasys();
        if (totalHpEasys !== null) {
            return totalHpEasys / 2;
        } else {
            return 0;
        }
    },

    async getSkippedHpsOffset() {
        try {
            return await this.contractHpEasy.methods.skippedHpEasysOffset().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getExchangeRate() {
        try {
            let exchangeRate = await this.contractEasyCoin.methods.exchangeRate().call();
            return (exchangeRate);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getBunchCyclesLimit() {
        try {
            return await this.contractHpEasy.methods.bunchCyclesLimit().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getHpEasy(id) {
        try {
            let hp = await this.contractHpEasy.methods.HpEasy(id).call();
            return {
                owner: hp.owner,
                matrixId: hp.matrix_id
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getHpEasyOwner() {
        try {
            return await this.contractHpEasy.methods.owner().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getEasyOwner() {
        try {
            return await this.contractEasyCoin.methods.owner().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUnacceptedOwnerHpEasy() {
        try {
            return await this.contractHpEasy.methods.newOwner().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUnacceptedOwnerEasy() {
        try {
            return await this.contractEasyCoin.methods.newOwner().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getEasyEthBalance() {
        try {
            return await this.web3.eth.getBalance(myConfig.CONTRACT_ADDRESS_EASYCOIN);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUseToken() {
        try {
            return await this.contractHpEasy.methods.useTokenPayment().call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getHpEthBalance() {
        try {
            return await this.web3.eth.getBalance(myConfig.CONTRACT_ADDRESS_HPEASY);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getEasyBalanceByUser(userAddress) {
        if (!this.currentAddress) return null;
        try {
            if (typeof userAddress === 'undefined') userAddress = this.currentAddress;
            let balance = await this.contractEasyCoin.methods.balanceOf(userAddress).call();
            return (balance / 1000000000000000000)
        } catch (error) {
            console.error(error);
            return null;
        }
    },


    // #endregion


    // #region PAYMENT Queue
    async getPaymentStatusForCurrentUser(callback) {
        if (!this.currentAddress) return null;
        try {
            let res = await this.contractHpEasy.methods.paymentQueue(this.currentAddress).call();

            res = {
                isEthPaid: res.is_eth_paid,
                isTokensPaid: res.is_tokens_paid,
                matrixToRenew: res.matrix_to_renew,
                referrer: res.referrer
            }
            if (typeof callback !== 'undefined' && callback !== null) {
                callback(res);
                return res;
            } else {
                return res;
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    },
    // #endregion


    // #region MATRICES
    async getCleanMatrix(matrixId) {
        let matrix = await this.contractHpEasy.methods.matrices(matrixId).call();
        if (matrix === null) return null;

        return {
            id: parseInt(matrix.id),
            owner: matrix.owner,
            referralsCnt: parseInt(matrix.referrals_cnt),
            matrixReferrer: parseInt(matrix.matrix_referrer),
            directReferrer: matrix.direct_referrer,
            fromHpeasy: parseInt(matrix.from_hpeasy),
            cycles: parseInt(matrix.cycles),
            bunchCycles: parseInt(matrix.bunch_cycles)
        }
    },

    async getUserMatrixId(userId, matrixIndex) {
        try {
            return await this.contractHpEasy.methods.usersMatrices(userId, matrixIndex).call();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getUserMatrixIds(userId) {
        let result = [];
        let i = 0;

        try {
            while (true) {
                let r = await this.contractHpEasy.methods.usersMatrices(userId, i).call();
                r = parseInt(r);
                if (r !== 0) {
                    result.push(r);
                    i++;
                } else {
                    break;
                }
            }
        } catch (error) {
            console.error("Interrupted receiving user " + userId + " matrices on step " + i);
            console.error(error);
        }

        return result;
    },

    //Obsolete
    async getUserMatrixIdsWithoutRenew(userId) {
        let result = [];
        let i = 0;

        try {
            while (true) {
                let r = await this.contractHpEasy.methods.usersMatrices(userId, i).call();
                r = parseInt(r);
                if (r !== 0) {
                    let matrix = await this.getCleanMatrix(r);
                    if (matrix.fromHpEasy !== 2) {
                        result.push(r);
                    }
                    i++;
                } else {
                    break;
                }
            }
        } catch (error) {
            console.error("Interrupted receiving user " + userId + " matrices on step " + i);
            console.error(error);
        }

        return result;
    },

    async getMatrixReferrers(matrixId) {
        let result = [];
        let i = 0;

        try {
            while (true) {
                let r = await this.contractHpEasy.methods.matrixReferrals(matrixId, i).call();
                r = parseInt(r);
                if (r !== 0) {
                    result.push(r);
                    i++;
                } else {
                    break;
                }
            }
        } catch (error) {
            console.error("Interrupted receiving matrix " + matrixId + " referrals on step " + i);
            console.error(error);
        }

        return result;
    },
    // #endregion


    // #region EVENTS
    async getContractTransferEventsByUser(eventName, userAddress) {
        try {
            let events = await utils.contractHpEasy.getPastEvents(eventName, {
                fromBlock: myConfig.HPEASY_FIRST_BLOCK,
                toBlock: 'latest',
                filter: { user: userAddress }
            });
            events = await this.appendBlockTimestamp(events);
            return events;
        } catch (error) {
            console.error("Getting " + eventName.toUpperCase() + " events for the contract is interrupted");
            console.error(error);
            return [];
        }
    },

    async appendBlockTimestamp(events) {
        for (let i = 0; i < events.length; i++) {
            try {
                let blockInfo = await utils.web3.eth.getBlock(events[i].blockNumber);
                events[i].block_timestamp = blockInfo.timestamp;
            } catch (error) {
                console.error("Couldnot append timestamps for i " + i);
                events[i].block_timestamp = 0;
            }
        }

        return events;

    },

    //Unused
    async getSkipMatrixEvents(matrixId) {
        try {
            return await utils.contractHpEasy.getPastEvents("SkipMatrix", {
                fromBlock: myConfig.HPEASY_FIRST_BLOCK,
                toBlock: 'latest',
                filter: { matrixId: matrixId.toString() }
            });
        } catch (error) {
            console.error("Getting SkipMatrix events for the contract is interrupted");
            console.error(error);
            return [];
        }
    },

    async getRegistrationCostChangeEvents() {
        try {
            return await utils.contractHpEasy.getPastEvents("ChangeRegistrationCost", {
                fromBlock: myConfig.HPEASY_FIRST_BLOCK,
                toBlock: 'latest'
            });
        } catch (error) {
            console.error("Getting NewJackpotWinner events for the contract is interrupted");
            console.error(error);
            return [];
        }
    },

    async getJackpotWinnerEvents(line, betSize) {
        try {
            return await utils.contractHpEasy.getPastEvents("NewJackpotWinner", {
                fromBlock: myConfig.HPEASY_FIRST_BLOCK,
                toBlock: 'latest',
                filter: { line: line.toString(), betSize: (betSize * 1000000).toString() + "000000000000" }
            });
        } catch (error) {
            console.error("Getting NewJackpotWinner events for the contract is interrupted");
            console.error(error);
            return [];
        }
    },
    // #endregion


    // #region UTILS
    prepareMessage(err) {
        console.log(JSON.stringify(err)); //TODO: delete
        console.log(err.toString()); //TODO: delete

        let m = err.toString().split(':');
        //console.log(m);
        let message = m.length > 1
            ? m[1]
            : (err.toString() !== "[object Object]"
                ? err.toString() : '');

        if (message.includes("Private key does not match address in transaction")) {
            message = "Please connect your Web3 provider <br><i>( <a href='" + myConfig.METAMASK_URL + "' target='_blank' rel='noopener noreferrer'>MetaMask</a> or other wallets that support online operations)</i>"
        }

        /*
        if (typeof err.output !== 'undefined' && typeof err.output.contractResult[0] !== 'undefined') {
            console.log(err.output);
            let t = err.output.contractResult[0].replace('08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000', '');
            t = this.hexToAscii(t);
            if (t) message += '<p><b>MESSAGE:</b> ' + t + '</p>';
        } */

        if (err.message && !err.message.toString().includes("blockHash")) {
            message += `<p> ${err.message}</p>`;
        }

        if (err.receipt && err.receipt.transactionHash) {
            message += '<p> <b>Tx:</b> ' + err.receipt.transactionHash + '</p>';
            message += "<p>You can the check transaction details manually on&nbsp;";
            message += "<a href='" + myConfig.ETHERSCAN_DOMAIN + "tx/" + err.receipt.transactionHash + "' target='_blank' title='Transaction info on Etherscan' rel='noopener noreferrer'>Etherscan</a><p>";
        } else {
            console.log("no tx data");
        }

        message += '<p>Please, retry action or refresh page</p>';
        return message;
    },

    //Unused
    hexToAscii(str1) {
        var hex = str1.toString();
        var str = '';
        for (var n = 0; n < hex.length; n += 2) {
            str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
        }
        return str;
    },

    getInt32Bytes(x) {
        let bytes = [];
        let i = 0;
        do {
            bytes[i++] = x & (255);
            x = x >> 8;
        } while (i < 4)

        return bytes;
    },

    getInt64Bytes(x) {
        let bytes = [];
        let i = 0;
        do {
            bytes[i++] = x & (255);
            x = x >> 8;
        } while (i < 8)

        return bytes;
    },

    serializeTwoInts(a, b) {
        let res = this.getInt64Bytes(a);
        return res.concat(this.getInt64Bytes(b));
    },
    // #endregion

    // #region ALERTS

    //#endregion

};

export default utils;