<?php
namespace SumoCoders\FrameworkCoreBundle\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Bundle\FrameworkBundle\Client;
use Symfony\Component\DomCrawler\Crawler;

class DatePickerControllerTest extends WebTestCase
{
    /**
     * @param string $method
     * @param string $url
     * @return Crawler
     */
    private function getCrawlerForRequest($method, $url)
    {
        $client = static::createClient();
        $crawler = $client->request($method, $url);

        return $crawler;
    }

    public function testIfChoiceRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');

        $this->assertEquals(1, $crawler->filter('select#form_date_example1_month')->count());
        $this->assertEquals(1, $crawler->filter('select#form_date_example1_day')->count());
        $this->assertEquals(1, $crawler->filter('select#form_date_example1_year')->count());
    }

    public function testIfTextRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');

        $this->assertEquals(1, $crawler->filter('input#form_date_example2_month')->count());
        $this->assertEquals(1, $crawler->filter('input#form_date_example2_day')->count());
        $this->assertEquals(1, $crawler->filter('input#form_date_example2_year')->count());
    }

    public function testIfSingleTextRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');

        $this->assertEquals(1, $crawler->filter('input#form_date_example3')->count());
    }

    public function testIfSingleTextWithDatePickerAndDefaultDateRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');

        $element = $crawler->filter('input#form_date_example4');
        $wrapper = $element->parents()->filter('.date-widget')->first();

        $this->assertEquals(1, $element->count());
        $this->assertEquals(1, $wrapper->count());
        $this->assertEquals('1985/06/20', $element->attr('value'));
    }

    public function testIfSingleTextWithDatePickerRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');
        $date = new \DateTime();

        $element = $crawler->filter('input#form_date_example5');
        $wrapper = $element->parents()->filter('.date-widget')->first();

        $this->assertEquals(1, $element->count());
        $this->assertEquals(1, $wrapper->count());

        $this->assertEquals($date->format('Y/m/j'), $element->attr('value'));
    }

    public function testIfSingleTextWithDatePickerAndOnlyDatesInTheFutureRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');
        $date = new \DateTime();
        $startDate = new \DateTime('last monday');

        $element = $crawler->filter('input#form_date_example6');

        $this->assertEquals(1, $element->count());

        // check if it has all the required data-attributes
        $this->assertEquals($startDate->format('Y-m-d'), $element->attr('data-date-start-date'));

        // check if the actual element is hidden
        $this->assertEquals($date->format('Y/m/j'), $element->attr('value'));
    }

    public function testIfSingleTextWithDatePickerAndOnlyDatesInThePastRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');
        $date = new \DateTime();
        $endDate = new \DateTime('next friday');

        $element = $crawler->filter('input#form_date_example7');

        $this->assertEquals(1, $element->count());

        // check if it has all the required data-attributes
        $this->assertEquals($endDate->format('Y-m-d'), $element->attr('data-date-end-date'));

        // check if the actual element is hidden
        $this->assertEquals($date->format('Y/m/j'), $element->attr('value'));
    }

    public function testIfSingleTextWithDatePickerAndOnlyDatesBetweenCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');
        $date = new \DateTime();
        $startDate = new \DateTime('last monday');
        $endDate = new \DateTime('next friday');

        $element = $crawler->filter('input#form_date_example8');
        $wrapper = $element->parents()->filter('.date-widget')->first();

        $this->assertEquals(1, $element->count());

        // check if it has all the required data-attributes
        $this->assertEquals($startDate->format('Y-m-d'), $element->attr('data-date-start-date'));
        $this->assertEquals($endDate->format('Y-m-d'), $element->attr('data-date-end-date'));

        // check if the actual element is hidden
        $this->assertEquals($date->format('Y/m/j'), $element->attr('value'));
    }

    public function testIfSingleTextWithoutDefaultDateRenderedCorrectly()
    {
        $crawler = $this->getCrawlerForRequest('GET', '/_tests/datepicker');

        $element = $crawler->filter('input#form_date_example9');
        $wrapper = $element->parents()->filter('.date-widget')->first();

        $this->assertEquals(1, $element->count());
        $this->assertEquals(1, $wrapper->count());

        // check if the actual element is hidden
        $this->assertEquals('', $element->attr('value'));
    }
}
