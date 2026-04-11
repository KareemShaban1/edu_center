<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Repository\Admin\PaymentRepositoryInterface;
use Illuminate\Http\Request;

class PaymentController extends Controller
{

    protected $payment;

    public function __construct(PaymentRepositoryInterface $payment)
    {
        $this->payment = $payment;
    }


    public function showGroups()
    {
        return $this->payment->showGroups();
    }
    public function choosePaymentMonth($id)
    {
        return $this->payment->choosePaymentMonth($id);
    }

    public function addEditPayment($section_id , $fee_id)
    {
        return $this->payment->addEditPayment($section_id , $fee_id);
    }

    public function storeUpdatePayment(Request $request)
    {
        return $this->payment->storeUpdatePayment($request);
    }

}
