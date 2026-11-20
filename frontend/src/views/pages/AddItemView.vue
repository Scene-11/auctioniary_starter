<template>
  <div class="page narrow">
    <div class="form-panel">
      <h1>List a New Card</h1>
      <p class="sub">Fill in the card details and submit it to the auction</p>

      <div class="ok-msg" v-if="draftLoaded">Editing a saved draft.</div>

      <!-- novalidate: all validation and messages are handled in English below -->
      <form novalidate @submit.prevent="handleSubmit">
        <div class="field">
          <label for="name">Card title</label>
          <input id="name" v-model="name" placeholder="e.g. W95-082 SSP signed foil" />
          <div class="err" v-show="submitted && !name.trim()">Title is required</div>
        </div>

        <div class="field">
          <label for="description">Description</label>
          <textarea id="description" v-model="description" rows="4"
            placeholder="Condition, rarity, foil finish, surface flaws…"></textarea>
          <div class="err" v-show="submitted && !description.trim()">Description is required</div>
        </div>

        <div class="field">
          <label for="image">Card photo (optional)</label>
          <input id="image" ref="imageInput" type="file" accept="image/*" class="file-input" @change="handleImageSelected" />
          <p class="hint">JPG or PNG. Large photos are resized automatically before upload.</p>
          <div class="image-preview" v-if="imagePreview">
            <img :src="imagePreview" alt="Preview of the photo that will be uploaded" />
            <button class="btn ghost" type="button" @click="clearImage">Remove photo</button>
          </div>
          <p class="hint" v-if="imageBusy">Processing image…</p>
          <div class="err" v-if="imageError">{{ imageError }}</div>
        </div>

        <div class="field">
          <label for="starting_bid">Starting bid (&pound;)</label>
          <input id="starting_bid" v-model="starting_bid" type="number" min="0" step="1" />
        </div>

        <div class="field">
          <label for="end_date">Auction ends</label>
          <input id="end_date" v-model="end_date" type="datetime-local" />
        </div>

        <div class="field">
          <label>Categories (select any)</label>
          <div class="cats">
            <label class="cat" v-for="cat in categories" :key="cat.category_id">
              <input type="checkbox" :value="cat.category_id" v-model="selectedCategories" />
              {{ cat.name }}
            </label>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn" type="submit">List Card</button>
          <button class="btn ghost" type="button" @click="handleSaveDraft">Save Draft</button>
        </div>

        <div class="err" v-if="error">{{ error }}</div>
        <div class="ok-msg" v-if="draftMsg">{{ draftMsg }}</div>
      </form>
    </div>

    <p class="back-link"><router-link to="/">&larr; Back to auctions</router-link></p>
  </div>
</template>

<script>
import coreService from '../../services/core.service.js'
import draftService from '../../services/draft.service.js'

export default {
  data() {
    return {
      name: '',
      description: '',
      starting_bid: '',
      end_date: '',
      selectedCategories: [],
      categories: [],
      imagePreview: '',
      imageError: '',
      imageBusy: false,
      draftId: null,
      draftLoaded: false,
      submitted: false,
      error: '',
      draftMsg: ''
    }
  },
  mounted() {
    coreService.getCategories().then((cats) => {
      this.categories = cats
      this.loadDraftIfAny()
    }).catch(() => {
      this.categories = []
      this.loadDraftIfAny()
    })
  },
  methods: {
    loadDraftIfAny() {
      const draftId = this.$route.query.draft
      if (!draftId) return
      const draft = draftService.getDraft(draftId)
      if (!draft) return
      this.draftId = draft.id
      this.draftLoaded = true
      this.name = draft.name || ''
      this.description = draft.description || ''
      this.starting_bid = draft.starting_bid || ''
      this.end_date = draft.end_date || ''
      this.selectedCategories = draft.category_ids || []
    },
    validate() {
      const startingBid = parseInt(this.starting_bid, 10)
      const endTs = this.end_date ? new Date(this.end_date).getTime() : NaN

      if (!this.name.trim() || !this.description.trim()) return 'Please fill in the title and description.'
      if (this.imageBusy) return 'Please wait until the photo has finished processing.'
      if (isNaN(startingBid) || startingBid < 0) return 'Starting bid must be a whole number of at least 0.'
      if (isNaN(endTs)) return 'Please choose an end date and time.'
      if (endTs <= Date.now()) return 'The end date must be in the future.'
      return null
    },
    handleSubmit() {
      this.submitted = true
      this.error = ''

      const problem = this.validate()
      if (problem) {
        this.error = problem
        return
      }

      const startingBid = parseInt(this.starting_bid, 10)
      const endTs = new Date(this.end_date).getTime()

      coreService.createItem(
        this.name.trim(),
        this.description.trim(),
        startingBid,
        endTs,
        this.selectedCategories,
        this.imagePreview
      ).then((data) => {
        if (this.draftId) draftService.deleteDraft(this.draftId)
        this.$router.push('/item/' + data.item_id)
      }).catch((err) => {
        this.error = err
      })
    },
    handleSaveDraft() {
      this.draftMsg = ''
      this.error = ''
      if (!this.name.trim() && !this.description.trim()) {
        this.error = 'Enter a title or description before saving a draft.'
        return
      }
      const saved = draftService.saveDraft({
        id: this.draftId,
        name: this.name,
        description: this.description,
        starting_bid: this.starting_bid,
        end_date: this.end_date,
        category_ids: this.selectedCategories
      })
      this.draftId = saved.id
      this.draftMsg = this.imagePreview
        ? 'Draft saved. Photos are not kept in drafts, so please pick the photo again when you publish.'
        : 'Draft saved. Find it in your Drafts box.'
    },
    handleImageSelected(event) {
      const file = event.target.files && event.target.files[0]
      this.imageError = ''
      this.imagePreview = ''
      if (!file) return
      if (!file.type || file.type.indexOf('image/') !== 0) {
        this.imageError = 'Please choose an image file (JPG or PNG).'
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        this.imageError = 'Please choose an image smaller than 8 MB.'
        return
      }
      this.imageBusy = true
      this.compressImage(file).then((dataUrl) => {
        this.imagePreview = dataUrl
        this.imageBusy = false
      }).catch((err) => {
        this.imageError = err.message
        this.imageBusy = false
      })
    },
    // Resize/compress in the browser so the request body stays small enough
    // for the JSON body limit on the server.
    compressImage(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Could not read that file.'))
        reader.onload = () => {
          const image = new Image()
          image.onerror = () => reject(new Error('That file is not a valid image.'))
          image.onload = () => {
            const maxSide = 640
            const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
            let width = Math.round(image.width * scale)
            let height = Math.round(image.height * scale)

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            let dataUrl = ''

            for (let attempt = 0; attempt < 4; attempt++) {
              canvas.width = width
              canvas.height = height
              ctx.drawImage(image, 0, 0, width, height)
              let quality = 0.75
              dataUrl = canvas.toDataURL('image/jpeg', quality)
              while (dataUrl.length > 60000 && quality > 0.4) {
                quality -= 0.1
                dataUrl = canvas.toDataURL('image/jpeg', quality)
              }
              if (dataUrl.length <= 60000) break
              width = Math.round(width * 0.75)
              height = Math.round(height * 0.75)
            }

            if (dataUrl.length > 60000) {
              reject(new Error('That photo is too large. Please choose a smaller one.'))
              return
            }
            resolve(dataUrl)
          }
          image.src = reader.result
        }
        reader.readAsDataURL(file)
      })
    },
    clearImage() {
      this.imagePreview = ''
      this.imageError = ''
      if (this.$refs.imageInput) this.$refs.imageInput.value = ''
    }
  }
}
</script>

<style scoped>
.narrow { max-width: 540px; }
.form-panel {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 24px;
  padding: 28px 26px;
  box-shadow: 0 12px 30px rgba(224, 43, 126, .12);
}
.sub { color: var(--muted); font-size: 14px; margin: 4px 0 16px; font-weight: 700; }
.field textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
}
.field textarea:focus { outline: none; border-color: var(--blue); }
.file-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px dashed var(--border);
  border-radius: 12px;
  background: var(--bg);
  font-size: 14px;
}
.hint { margin: 6px 0 0; color: var(--muted); font-size: 12.5px; font-weight: 600; }
.image-preview { margin-top: 10px; display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.image-preview img {
  width: 150px;
  border-radius: 10px;
  border: 2px solid var(--border);
  display: block;
}
.cats { display: flex; flex-wrap: wrap; gap: 10px; }
.cat { font-size: 14px; display: flex; align-items: center; gap: 5px; font-weight: 700; }
.btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
.back-link { margin-top: 16px; font-weight: 700; }
</style>
