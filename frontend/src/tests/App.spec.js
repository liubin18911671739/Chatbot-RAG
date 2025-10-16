import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '@/App.vue'

describe('App.vue', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'Home',
          component: { template: '<div>Home</div>' }
        }
      ]
    })
  })

  it('renders properly', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    await router.isReady()
    expect(wrapper.exists()).toBe(true)
  })

  it('has router-view', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })
})
