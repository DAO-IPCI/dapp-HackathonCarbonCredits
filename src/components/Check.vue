<template>
  <div>
    <v-container grid-list-md>
      <v-layout justify-center row wrap>
        <v-flex md6>
          <v-card>
            <v-card-title primary-title>
              <h3 class="headline mb-0 text-xs-center">Hackathon Carbon Сredits Check</h3>
            </v-card-title>
            <v-card-text>
              <v-container grid-list-md>
                <v-layout row wrap>
                  <v-flex md12>
                    <v-form ref="form" v-model="valid" lazy-validation>
                      <v-text-field
                        v-model="liability"
                        :rules="requireRule"
                        label="Liability address"
                        required
                      ></v-text-field>
                    </v-form>
                  </v-flex>
                </v-layout>
              </v-container>
              <v-btn
                :loading="loadingCheck"
                :disabled="loadingCheck || !valid"
                color="primary"
                @click.native="check"
              >
                Check
              </v-btn>
              <v-icon v-if="submit && isCheck === false" large color="red darken-2">mdi-close</v-icon>
              <v-divider class="my-3" />
              <div>
                <h3>Example:</h3>
                Contract with energy web blockchain tx - [<b>0xaDD5AAFCc5779338Fd809B740f8cc0606A804275</b>]<br />
                Contract with DAO IPCI on Ethereum mainnet tx - [<b>0x522142dcb90d014b071D77d522817eE27be2342F</b>]
              </div>
              <v-divider class="my-3" />
              <div v-if="isCheck">
                <v-alert :value="true" :type="result.compensation.burn === 0 ? 'warning' : 'success'" style="color: #616161;" v-if="result.type === 'Coal'">
                  type: <b>{{result.type}}</b><br />
                  quantity: <b>{{result.quantity}}</b><br />
                  compensation factor: <b>{{result.compensation.factor}}</b><br />
                  compensation proof: <b><a :href="`https://etherscan.io/tx/${result.compensation.proof}`" target="_blank">{{result.compensation.proof}}</a></b><br />
                  compensation burn: <b>{{result.compensation.burn}}</b><br />
                  compensation quantity: <b>{{result.compensation.quantity}}</b>
                </v-alert>
                <v-alert :value="true" type="success" v-else>
                  type: <b>{{result.type}}</b><br />
                  proof: <b><a :href="`https://tobalaba.etherscan.com/address/${result.proof}`" style="color: #616161;" target="_blank">{{result.proof}}</a></b><br />
                  quantity: <b>{{result.quantity}}</b>
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import { Liability } from 'robonomics-js'
import ipfsBagCat from '../utils/ipfs'

export default {
  name: 'Check',
  data () {
    return {
      submit: false,
      isCheck: false,
      loadingCheck: false,
      valid: false,
      liability: '',
      requireRule: [
        v => !!v || 'Field required',
        v => web3.isAddress(v) || 'Wrong address'
      ],
      result: {}
    }
  },
  methods: {
    check () {
      if (this.$refs.form.validate()) {
        this.loadingCheck = true
        const liability = new Liability(web3, this.liability, this.liability)
        liability.getInfo()
          .then((r) => {
            if (r.result !== '') {
              this.result = {
                type: '',
                proof: '',
                quantity: '',
                compensation: {
                  factor: '',
                  proof: '',
                  burn: '',
                  quantity: ''
                }
              }
              ipfsBagCat(r.result, {}, (topic, msg) => {
                if (topic === '/consumption/provenance/type') {
                  this.result.type = msg
                } else if (topic === '/consumption/provenance/proof') {
                  this.result.proof = msg
                } else if (topic === '/consumption/quantity') {
                  this.result.quantity = msg
                } else if (topic === '/consumption/compensation/factor') {
                  this.result.compensation.factor = msg
                } else if (topic === '/consumption/compensation/proof') {
                  this.result.compensation.proof = msg
                } else if (topic === '/consumption/compensation/quantity') {
                  this.result.compensation.quantity = msg
                }
                if (this.result.type !== '' && this.result.proof !== '' && this.result.quantity !== '' && this.result.compensation.factor !== '' && this.result.compensation.proof !== '' && this.result.compensation.quantity !== '') {
                  if (this.result.type === 'Coal') {
                    web3.eth.getTransaction(this.result.compensation.proof, (e, r) => {
                      if (e || (e === null && r === null)) {
                        this.result.compensation.burn = 0
                        this.submit = true
                        this.loadingCheck = false
                        this.isCheck = true
                        return
                      }
                      this.result.compensation.burn = parseInt(r.input.substr(-64), 16)
                      this.submit = true
                      this.loadingCheck = false
                      this.isCheck = true
                    })
                  } else {
                    this.submit = true
                    this.loadingCheck = false
                    this.isCheck = true
                  }
                }
                console.log(topic, msg)
              })
            } else {
              this.submit = true
              this.loadingCheck = false
              this.isCheck = false
            }
          })
          .catch(() => {
            this.submit = true
            this.loadingCheck = false
            this.isCheck = false
          })
      }
    }
  }
}
</script>
